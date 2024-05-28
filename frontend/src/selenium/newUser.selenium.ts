import { Livequiz } from './livequiz';
import { readFileSync } from 'fs';

describe("E2E tests", () => {
    it("Correctly identifies 2 users", async () => {
        const admin = await Livequiz.reset();
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
        await Livequiz.wait(200);
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
    }, 10000);

    it("Stores stats", async () => {
        const admin = await Livequiz.reset();

        await Livequiz.wait(200);
        let user1 = await Livequiz.init();
        await user1.id('cname').sendKeys('Testing');
        await user1.click('Add a course', 'Testing', 'Create Quiz', 'Save', 'Start Quiz', 'Enter Dojo');

        await Livequiz.wait(200);
        await admin.click("Stats");

        user1.browser.quit();
        admin.browser.quit();
    });

    it("Corrections", async () => {
        // Verify that the fully-wrong answer comes before the half-correct, which comes
        // before the fully-correct one.
        const admin = await Livequiz.reset();
        await admin.id('cname').sendKeys('Testing');
        await admin.click('Add a course', 'Testing');
        await admin.id('fileInput').sendKeys(`${__dirname}/quiz1.md`);
        await admin.click('Start Quiz', 'Enter Dojo', 'wrong', 'Next', 'correct', 'Next');
        await admin.id('quizInput').sendKeys('one');
        await admin.click('Testing', 'Start Corrections');

        await admin.find("Question 1");
        await admin.click('Next');
        await admin.find("Question 2");
        await admin.click('Next');
        await admin.find("Question 3");
        admin.browser.quit();
    });

    it("Change dojo", async () => {
        // Create two quizzes and change the quiz in the dojo
        const admin = await Livequiz.reset();
        await admin.id('cname').sendKeys('Testing');
        await admin.click('Add a course', 'Testing');
        await admin.id('fileInput').sendKeys(`${__dirname}/quiz1.md`);
        await admin.click('Create Quiz', 'Save');
        await admin.click('Start Quiz');
        await admin.find('Quiz in Dojo: Test Quiz');
        await admin.text('Start Quiz', 2).click();
        await admin.find('Quiz in Dojo: Title of Quiz');
        admin.browser.quit();
    });

    it("Sorts and merges wrong regexps", async () => {
        // Create two quizzes and change the quiz in the dojo
        const admin = await Livequiz.reset();
        await admin.id('cname').sendKeys('Testing');
        await admin.click('Add a course', 'Testing');
        await admin.id('fileInput').sendKeys(`${__dirname}/quiz1.md`);
        await admin.click('Start Quiz');
        const courseUrl = await admin.browser.getCurrentUrl() + "/dojo";

        const user1 = await Livequiz.init(courseUrl);
        const user2 = await Livequiz.init(courseUrl);
        const user3 = await Livequiz.init(courseUrl);
        await Livequiz.wait(200);
        await user1.click('Next', 'Next');
        await user1.id('quizInput').sendKeys(' three!!');
        await user2.click('Next', 'Next');
        await user2.id('quizInput').sendKeys('four');
        await user3.click('Next', 'Next');
        await user3.id('quizInput').sendKeys('three!!');

        await Livequiz.wait(300);
        await admin.click("Corrections", "Next", "Next");
        await admin.text('three').find();
        await throwError(() => admin.text('three!!', 2).find());
        await admin.text('four').find();

        await admin.browser.quit();
        await user1.browser.quit();
        await user2.browser.quit();
        await user3.browser.quit();
    }, 10000);
});

async function throwError(f: () => Promise<any>): Promise<void> {
    try {
        await f();
    } catch (_) {
        return;
    }
    return Promise.reject("Didn't throw error");
}
