module.exports = {
    // Success
    SUCCESS: {"isSuccess": true, "code": 1000, "message": "성공"},
    
    //Request error
    // Token
    ACCESS_TOKEN_EMPTY: {isSuccess: false, code: 1100, message: "access token is empty"},
    ACCESS_TOKEN_VERFICATION_FAIL: {isSuccess: false, code: 1101, message: "access token verification failed"},
    ACCESS_TOKEN_EXPIRED: {isSuccess: false, code: 1102, message: "access token has expired"},

    REFRESH_TOKEN_EMPTY: {isSuccess: false, code: 1110, message: "refresh token is empty"},
    REFRESH_TOKEN_VERIFICATION_FAIL: {isSuccess: false, code: 1111, message: "refresh token verification failed"},
    REFRESH_TOKEN_EXPIRED: {isSuccess: false, code: 1112, message: "refresh token has expired"},

    EV_TOKEN_EMPTY: {isSuccess: false, code: 1120, message: "email was not verified"},
    EV_TOKEN_VERIFICATION_FAIL: {isSuccess: false, code: 1121, message: "ev token verification failed"},
    EV_TOKEN_EXPIRED: {isSuccess: false, code: 1122, message: "ev token expired"},
    
    // Session
    IP_CHANGE_ERROR: {isSuccess: false, code: 1200, message: "ip has changed. please re-login"},
    SESSION_EXPIRED: {isSuccess: false, code: 1201, message: "session expired from server"},

    // SignIn
    EMAIL_EMPTY: {isSuccess: false, code: 1300, message: "email empty"},
    EMAIL_VALIDATION_FAIL: {isSuccess: false, code: 1301, message: "email condition does not match"},

    // EvStart
    EV_VERIFICATION_COUNT_EXCEEDED: {isSuccess: false, code: 1401, message: "verification count per day exceeded"},
    // EvEnd
    EV_CREDENTIAL_EMPTY: {isSuccess: false, code: 1401, message: "email or code is empty"},
    EV_CODE_NOT_MATCH: {isSuccess: false, code: 1402, message: "code is not same"},
    EV_CODE_NOT_GENERATED: {isSuccess: false, code: 1403, message: "email verification code is not generated"},
    EV_VERIFICATION_TIMEOUT: {isSuccess: false, code: 1404, message: "email verification code is outdated"},
    EV_USER_EXIST: {isSuccess: false, code: 1405, message: "user already registered"},

    // SignUp
    PASSWORD_EMPTY: {isSuccess: false, code: 1500, message: "password is empty"},
    NICKNAME_EMPTY: {isSuccess: false, code: 1501, message: "nickname is empty"},
    PASSWORD_VALIDATION_FAIL: {isSuccess: false, code: 1510, message: "password condition does not match"},
    NICKNAME_VALIDATION_FAIL: {isSuccess: false, code: 1511, message: "nickname condition does not match"},
    EV_VERIFICATION_FAIL: {isSuccess: false, code: 1520, message: "email verification process failed"},

    // User
    USER_VALIDATION_FAILURE: {isSuccess: false, code: 2000, message: "user validation failed" },
    ACCOUNT_DETAILS_SAVED: {isSuccess: false, code: 2001, message: "account details already saved"},

    // Reward
    CHALLENGE_NOT_FOUND: {"isSuccess": false, code: 3001, message: "challenge cannot found" },
    
    //Connection, Transaction 등의 서버 오류
    DB_ERROR: {"isSuccess": false, "code": 9000, "message": "데이터 베이스 에러"},
    SERVER_ERROR: {"isSuccess": false, "code": 9001, "message": "서버 에러"},
}
