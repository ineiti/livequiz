import { Builder, Browser, By, ThenableWebDriver, WebDriver, Locator, WebElementPromise } from 'selenium-webdriver';

class Livequiz {
    browser!: WebDriver;
    static async init(url = 'http://localhost:4200/reset'): Promise<Livequiz> {
        const lq = new Livequiz();
        lq.browser = await new Builder().forBrowser(Browser.CHROME).build();
        await lq.browser.get(url);
        return lq;
    }

    by(loc: Locator): WEP {
        return new WEP(this.browser.findElement(loc));
    }

    id(id: string): WEP {
        return this.by(By.id(id));
    }

    css(css: string): WEP {
        return this.by(By.css(css));
    }

    linkText(lt: string): WEP {
        return this.by(By.linkText(lt));
    }

    xpath(xp: string): WEP {
        return this.by(By.xpath(xp));
    }

    text(t: string): WEP {
        return this.xpath(`//*[contains(text(), "${t}")]`);
    }

    async click(t: string) {
        await this.text(t).click();
    }
}

class WEP {
    constructor(private p: WebElementPromise) { }

    async click() {
        await (await this.p).click();
    }
    async sendKeys(t: string) {
        await (await this.p).sendKeys(t);
    }
}

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
