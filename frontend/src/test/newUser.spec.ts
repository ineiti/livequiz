import { Livequiz } from './livequiz';
import { readFileSync } from 'fs';

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

        let user1 = await Livequiz.init(courseUrl + '/dojo');
        await Livequiz.wait(200);
        await user1.click("correct");
        await user1.id("userName").clear();
        await user1.id("userName").sendKeys("user1");

        let user2 = await Livequiz.init(courseUrl);
        await user2.id("userName").clear();
        await user2.id("userName").sendKeys("user2");
        await user2.click("LiveQuiz");
        await user2.click("Testing");
        await user2.click("Enter Dojo");
        await user2.click("wrong");
        await user2.click("Next");
        await user2.click("correct");

        await Livequiz.wait(200);
        await admin.text("user1").find();
        await admin.text("user2").find();

        await admin.click("Testing");
        await admin.click("Edit");
        await admin.css("textarea").clear();
        const quiz = readFileSync(`${__dirname}/quiz1.md`).toString().replace("second", "zweite");
        await admin.css("textarea").sendKeys(quiz);
        await admin.click("Save");

        await Livequiz.wait(200);
        await user2.text("zweite").find();

        await Livequiz.wait(100);
        user1.browser.quit();
        user2.browser.quit();

        await Livequiz.wait(100);
        admin.browser.quit();
    });
})
