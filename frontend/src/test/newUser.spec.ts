import { Livequiz } from './livequiz';

describe("Logging in", () => {
    it("Correctly identifies 2 users", async () => {
        const admin = await Livequiz.init();
        await admin.id('cname').sendKeys('Testing');
        await admin.css('button').click();
        await admin.linkText('Testing').click();
        const courseUrl = await admin.browser.getCurrentUrl();

        await admin.id('fileInput').sendKeys(`${__dirname}/quiz1.md`);
        await admin.click("Start Quiz");
        await admin.click("Show Progress");

        await Livequiz.wait(200);

        let user1 = await Livequiz.init(courseUrl);
        await user1.id("userName").clear();
        await user1.id("userName").sendKeys("user1");
        await user1.click("LiveQuiz");
        await user1.click("Testing");
        await user1.click("Enter Dojo");
        await user1.click("correct");

        let user2 = await Livequiz.init(courseUrl);
        await user2.id("userName").clear();
        await user2.id("userName").sendKeys("user2");
        await user2.click("Enter Dojo");
        await user2.click("wrong");
        await user2.click("Next");
        await user2.click("correct");

        await Livequiz.wait(200);
        await admin.text("user1").find();
        await admin.text("user2").find();

        await Livequiz.wait(100);
        user1.browser.quit();
        user2.browser.quit();

        await Livequiz.wait(100);
        admin.browser.quit();
    });
})
