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

        await new Promise((resolve) => setTimeout(resolve, 200));

        let user1 = await Livequiz.init(courseUrl);
        await user1.click("Home")
        await user1.click("Testing")
        await user1.click("Enter Dojo");
        await user1.click("correct");

        let user2 = await Livequiz.init(courseUrl);
        await user2.click("Enter Dojo");
        await user2.click("wrong");
        await user2.click("Next");
        await user2.click("correct");

        await new Promise((resolve) => setTimeout(resolve, 100));
        user1.browser.quit();
        user2.browser.quit();

        await new Promise((resolve) => setTimeout(resolve, 500));
        admin.browser.quit();
    });
})
