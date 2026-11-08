using CompanyAPP.Services.Common;

namespace CompanyAPP.Tests;

public class InviteTokenTests
{
    [Fact]
    public void Hash_ShouldMatchOriginalToken_AndRejectOtherToken()
    {
        var token = InviteToken.Create();
        var hash = InviteToken.Hash(token);

        Assert.True(InviteToken.Matches(token, hash));
        Assert.False(InviteToken.Matches("deadbeef", hash));
        Assert.False(InviteToken.Matches(token, null));
    }
}
