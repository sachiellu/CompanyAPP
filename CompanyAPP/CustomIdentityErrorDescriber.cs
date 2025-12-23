using Microsoft.AspNetCore.Identity;

namespace CompanyAPP // 記得確認你的 namespace
{
    public class CustomIdentityErrorDescriber : IdentityErrorDescriber
    {
        // 1. 預設錯誤：發生未知的錯誤
        public override IdentityError DefaultError()
        {
            return new IdentityError { Code = nameof(DefaultError), Description = "發生未知的錯誤。" };
        }

        // 2. 併發錯誤：資料已被其他人修改
        public override IdentityError ConcurrencyFailure()
        {
            return new IdentityError { Code = nameof(ConcurrencyFailure), Description = "資料已被修改，請重新載入後再試。" };
        }

        // 3. 密碼錯誤：密碼長度不足
        public override IdentityError PasswordTooShort(int length)
        {
            return new IdentityError { Code = nameof(PasswordTooShort), Description = $"密碼長度必須至少為 {length} 個字元。" };
        }

        // 4. 密碼錯誤：需要非英數符號 (就是你截圖那個錯誤！)
        public override IdentityError PasswordRequiresNonAlphanumeric()
        {
            return new IdentityError { Code = nameof(PasswordRequiresNonAlphanumeric), Description = "密碼必須包含至少一個非字母或數字的符號 (例如 @#$%)。" };
        }

        // 5. 密碼錯誤：需要數字
        public override IdentityError PasswordRequiresDigit()
        {
            return new IdentityError { Code = nameof(PasswordRequiresDigit), Description = "密碼必須包含至少一個數字 ('0'-'9')。" };
        }

        // 6. 密碼錯誤：需要小寫字母
        public override IdentityError PasswordRequiresLower()
        {
            return new IdentityError { Code = nameof(PasswordRequiresLower), Description = "密碼必須包含至少一個小寫字母 ('a'-'z')。" };
        }

        // 7. 密碼錯誤：需要大寫字母
        public override IdentityError PasswordRequiresUpper()
        {
            return new IdentityError { Code = nameof(PasswordRequiresUpper), Description = "密碼必須包含至少一個大寫字母 ('A'-'Z')。" };
        }

        // 8. 帳號錯誤：使用者名稱已存在
        public override IdentityError DuplicateUserName(string ? userName)
        {
            return new IdentityError { Code = nameof(DuplicateUserName), Description = $"使用者名稱 '{userName}' 已經被使用了。" };
        }

        // 9. 帳號錯誤：Email 已存在
        public override IdentityError DuplicateEmail(string ? email)
        {
            return new IdentityError { Code = nameof(DuplicateEmail), Description = $"電子信箱 '{email}' 已經被使用了。" };
        }

        // 10. 帳號錯誤：使用者名稱含有無效字元
        public override IdentityError InvalidUserName(string ? userName)
        {
            return new IdentityError { Code = nameof(InvalidUserName), Description = $"使用者名稱 '{userName}' 含有無效的字元，只能使用字母或數字。" };
        }
    }
}