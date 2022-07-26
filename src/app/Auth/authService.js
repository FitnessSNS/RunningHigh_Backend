const authProvider = require('./authProvider');
const baseResponse = require('../../../config/baseResponseStatus');
const {response, errResponse} = require('../../../config/response');
const util = require('util');
const crypto = require('crypto');
const randomBytesPromisified = util.promisify(crypto.randomBytes);
const pbkdf2Promisified = util.promisify(crypto.pbkdf2);

// Prisma Client
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

// 메일 인증 객체
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service   : process.env.MAIL_SERVICE,
    host      : process.env.MAIL_HOST,
    port      : 587,
    secure    : true,
    requireTLS: true,
    auth      : {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});


// CREATE
// 세션 생성
exports.createSession = async (user_id, refresh_token, ip) => {
    try {
        await prisma.session.create({
            data: {
                user_id      : user_id,
                refresh_token: refresh_token,
                ip           : ip
            }
        });
    } catch (error) {
        customLogger.error(`createSession - database error\n${error.message}`);
        throw error;
    }
};

// 이메일 인증정보 생성
exports.createEmailVerification = async (email, code) => {
    // DB에 인증정보 저장
    try {
        await prisma.EmailVerification.create({
            data: {
                email: email,
                code : code
            }
        });
    } catch (error) {
        customLogger.error(`createEmailVerification - database error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 메일 내용
    const mailContent = `
            <h2>Running High</h2>
            <h3>인증 이메일 확인</h3>
            <p>다음 코드를 사용해서 메일을 인증하세요</p>
            <p>${code}</p>
        `;
    
    // 메일 옵션
    const mailOption = {
        from   : process.env.MAIL_USER,
        to     : `${email}`,
        subject: "러닝하이 회원가입 인증코드",
        html   : `${mailContent}`
    };
    
    // 메일 인증 송신
    await transporter.sendMail(mailOption, async (error, info) => {
        if (error) {
            customLogger.warn(`createEmailVerification - nodeMailer error\n${error.message}`);
            return errResponse(baseResponse.MAIL_TRANSPORTER_ERROR);
        } else {
            customLogger.info(`Email : ${email} - API Server sent verification code`);
        }
    });
    
    // 이메일 인증정보 응답 객체 생성
    try {
        const emailVerificationFinalResult = await authProvider.getEmailVerification(email);
        
        const finalResponse = {
            userEmail        : emailVerificationFinalResult[0].email,
            verificationCount: emailVerificationFinalResult[0].verification_count,
            isVerified       : emailVerificationFinalResult[0].is_verified
        };
        
        return response(baseResponse.SUCCESS, finalResponse);
    } catch {
        return errResponse(baseResponse.DB_ERROR);
    }
};

// 로컬계정 생성
exports.createLocalUser = async (email, nickname, password) => {
    // salt 생성
    const createSalt = await randomBytesPromisified(64);
    const salt = createSalt.toString('base64');
    
    // 해시 비밀번호 생성
    const createHashedPassword = await pbkdf2Promisified(password, salt, 17450, 64, 'sha512');
    const hashedPassword = createHashedPassword.toString('base64');
    
    try {
        // 로컬계정 생성
        const nicknameBuffer = Buffer.from(nickname);
        const createUserInfo = prisma.User.create({
            data: {
                email   : email,
                provider: 'local',
                password: hashedPassword,
                salt    : salt,
                nickname: nicknameBuffer
            }
        });
        
        // 이메일 인증정보 삭제
        const deleteEmailVerification = prisma.EmailVerification.deleteMany({
            where: {email: email}
        });
        
        // 트랜잭션 처리
        await prisma.$transaction([createUserInfo, deleteEmailVerification]);
    } catch (error) {
        customLogger.error(`createLocalUser - transaction error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 로컬계정 정보 불러오기
    try {
        const userInfoResult = await authProvider.getUserInfoByEmail('local', email);
        
        return response(baseResponse.SUCCESS, userInfoResult[0]);
    } catch {
        return errResponse(baseResponse.DB_ERROR);
    }
};

// OAuth 계정 생성
exports.createOAuthUser = async (provider, email) => {
    try {
        // OAuth 계정 생성
        const createUserInfo = prisma.User.create({
            data: {
                provider: provider,
                email   : email,
            }
        });
        
        // 이메일 인증정보 삭제
        const deleteEmailVerification = prisma.EmailVerification.deleteMany({
            where: {email: email}
        });
        
        // 트랜잭션 처리
        await prisma.$transaction([createUserInfo, deleteEmailVerification]);
    } catch (error) {
        customLogger.error(`createUser - database error\n${error.message}`);
        throw error;
    }
    
    // 계정정보 불러오기
    try {
        return await authProvider.getUserInfoByEmail(provider, email);
    } catch (error) {
        throw error;
    }
};

// 비밀번호 찾기 이메일 인증정보 생성
exports.createUserInfoEmailVerification = async (email, code) => {
    // DB에 인증정보 저장
    try {
        await prisma.EmailVerification.create({
            data: {
                email: email,
                code : code
            }
        });
    } catch (error) {
        customLogger.error(`createUserInfoEmailVerification - database error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 메일 내용
    const mailContent = `
            <h2>Running High</h2>
            <h3>비밀번호 찾기 이메일 확인</h3>
            <p>다음 코드를 사용해서 비밀번호 찾기 코드를 인증하세요</p>
            <p>${code}</p>
        `;
    
    // 메일 옵션
    const mailOption = {
        from   : process.env.MAIL_USER,
        to     : `${email}`,
        subject: "비밀번호 찾기 인증코드",
        html   : `${mailContent}`
    };
    
    // 메일 인증 송신
    await transporter.sendMail(mailOption, async (error, info) => {
        if (error) {
            customLogger.warn(`createUserInfoEmailVerification - nodeMailer error\n${error.message}`);
            return errResponse(baseResponse.MAIL_TRANSPORTER_ERROR);
        } else {
            customLogger.info(`Email : ${email} - API Server sent verification code`);
        }
    });
    
    // 이메일 인증정보 응답 객체 생성
    try {
        const emailVerificationFinalResult = await authProvider.getEmailVerification(email);
        
        const finalResponse = {
            userEmail        : emailVerificationFinalResult[0].email,
            verificationCount: emailVerificationFinalResult[0].verification_count,
            isVerified       : emailVerificationFinalResult[0].is_verified
        };
        
        return response(baseResponse.SUCCESS, finalResponse);
    } catch {
        return errResponse(baseResponse.DB_ERROR);
    }
};


// UPDATE
// 세션 정보 수정
exports.updateSession = async (userId, refreshToken, ip) => {
    try {
        await prisma.Session.updateMany({
            where: {
                user_id: userId
            },
            data : {
                refresh_token: refreshToken,
                ip           : ip
            }
        });
    } catch (error) {
        customLogger.error(`updateSession - database error\n${error.message}`);
        throw error;
    }
};

// 이메일 인증 정보 수정
exports.updateEmailVerification = async (email, code, verificationCount) => {
    try {
        // DB에 인증정보 수정
        await prisma.EmailVerification.update({
            where: {
                email: email
            },
            data : {
                code              : code,
                verification_count: verificationCount
            }
        });
    } catch (error) {
        customLogger.error(`updateEmailVerification - database error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 메일 내용
    const mailContent = `
            <h2>Running High</h2>
            <h3>인증 이메일 확인</h3>
            <p>다음 코드를 사용해서 메일을 인증하세요</p>
            <p>${code}</p>
        `;
    
    // 메일 옵션
    const mailOption = {
        from   : process.env.MAIL_USER,
        to     : `${email}`,
        subject: "러닝하이 회원가입 인증코드",
        html   : `${mailContent}`
    };
    
    // 메일 인증 송신
    await transporter.sendMail(mailOption, async (error, info) => {
        if (error) {
            customLogger.warn(`updateEmailVerification - nodeMailer error\n${error.message}`);
            return errResponse(baseResponse.MAIL_TRANSPORTER_ERROR);
        } else {
            customLogger.info(`Email : ${email} - API Server sent verification code`);
        }
    });
    
    // 이메일 인증정보 응답 객체 생성
    try {
        const emailVerificationFinalResult = await authProvider.getEmailVerification(email);
        
        const finalResponse = {
            userEmail        : emailVerificationFinalResult[0].email,
            verificationCount: emailVerificationFinalResult[0].verification_count,
            isVerified       : emailVerificationFinalResult[0].is_verified
        };
        
        return response(baseResponse.SUCCESS, finalResponse);
    } catch (error) {
        return errResponse(baseResponse.DB_ERROR);
    }
};

// OAuth 추가정보 등록
exports.addUserInfo = async (provider, email, nickname) => {
    try {
        // 계정 추가정보 수정
        const nicknameBuffer = Buffer.from(nickname);
        await prisma.User.updateMany({
            where: {
                provider: provider,
                email   : email
            },
            data : {
                nickname: nicknameBuffer
            }
        });
    } catch (error) {
        customLogger.error(`updateOAuthAddInfo - database error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 계정정보 불러오기
    try {
        const userInfoResult = await authProvider.getUserInfoByEmail(provider, email);
        
        return response(baseResponse.SUCCESS, userInfoResult[0]);
    } catch {
        return errResponse(baseResponse.DB_ERROR);
    }
};

// 비밀번호 찾기 이메일 인증 정보 수정
exports.updateUserInfoEmailVerification = async (email, code, verificationCount) => {
    try {
        // DB에 인증정보 수정
        await prisma.EmailVerification.update({
            where: {
                email: email
            },
            data : {
                code              : code,
                verification_count: verificationCount
            }
        });
    } catch (error) {
        customLogger.error(`updateUserInfoEmailVerification - database error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 메일 내용
    const mailContent = `
            <h2>Running High</h2>
            <h3>비밀번호 찾기 이메일 확인</h3>
            <p>다음 코드를 사용해서 비밀번호 찾기 코드를 인증하세요</p>
            <p>${code}</p>
        `;
    
    // 메일 옵션
    const mailOption = {
        from   : process.env.MAIL_USER,
        to     : `${email}`,
        subject: "비밀번호 찾기 인증코드",
        html   : `${mailContent}`
    };
    
    // 메일 인증 송신
    await transporter.sendMail(mailOption, async (error, info) => {
        if (error) {
            customLogger.warn(`updateUserInfoEmailVerification - nodeMailer error\n${error.message}`);
            return errResponse(baseResponse.MAIL_TRANSPORTER_ERROR);
        } else {
            customLogger.info(`Email : ${email} - API Server sent verification code`);
        }
    });
    
    // 이메일 인증정보 응답 객체 생성
    try {
        const emailVerificationFinalResult = await authProvider.getEmailVerification(email);
        
        const finalResponse = {
            userEmail        : emailVerificationFinalResult[0].email,
            verificationCount: emailVerificationFinalResult[0].verification_count,
            isVerified       : emailVerificationFinalResult[0].is_verified
        };
        
        return response(baseResponse.SUCCESS, finalResponse);
    } catch (error) {
        return errResponse(baseResponse.DB_ERROR);
    }
};

// 임시 비밀번호 변경
exports.updateUserInfoPassword = async (email, password) => {
    // salt 생성
    const createSalt = await randomBytesPromisified(64);
    const salt = createSalt.toString('base64');
    
    // 해시 비밀번호 생성
    const createHashedPassword = await pbkdf2Promisified(password, salt, 17450, 64, 'sha512');
    const hashedPassword = createHashedPassword.toString('base64');
    
    try {
        // 로컬계정 비밀번호 수정
        const updateUserPassword = prisma.User.updateMany({
            data : {
                password: hashedPassword,
                salt    : salt,
            },
            where: {
                provider: 'local',
                email   : email
            }
        });
        
        // 이메일 인증정보 삭제
        const deleteEmailVerification = prisma.EmailVerification.deleteMany({
            where: {email: email}
        });
        
        // 트랜잭션 처리
        await prisma.$transaction([updateUserPassword, deleteEmailVerification]);
    } catch (error) {
        customLogger.error(`updateUserInfoPassword - transaction error\n${error.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
    
    // 메일 내용
    const mailContent = `
            <h2>Running High</h2>
            <h3>임시 비밀번호</h3>
            <p>아래 비밀번호로 로그인 후 비밀번호를 변경해주세요!</p>
            <p>${password}</p>
        `;
    
    // 메일 옵션
    const mailOption = {
        from   : process.env.MAIL_USER,
        to     : `${email}`,
        subject: "임시 비밀번호",
        html   : `${mailContent}`
    };
    
    // 메일 인증 송신
    await transporter.sendMail(mailOption, async (error, info) => {
        if (error) {
            customLogger.warn(`updateUserInfoPassword - nodeMailer error\n${error.message}`);
            return errResponse(baseResponse.MAIL_TRANSPORTER_ERROR);
        } else {
            customLogger.info(`Email : ${email} - API Server sent verification code`);
        }
    });
};


// DELETE
// 리프레시 토큰 삭제
exports.deleteRefreshToken = async (userId) => {
    try {
        // 로그아웃 리프레시 토큰 삭제
        await prisma.Session.deleteMany({
            where: {user_id: userId}
        });
    } catch (error) {
        customLogger.error(`deleteRefreshToken - database error\n${error.message}`);
    }
};

// 이메일 인증정보 삭제
exports.deleteEmailVerification = async (email) => {
    try {
        await prisma.EmailVerification.deleteMany({
            where: {email: email}
        });
    } catch (error) {
        customLogger.error(`deleteEmailVerification - database error\n${error.message}`);
        throw error;
    }
};