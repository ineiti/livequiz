import { Builder, Browser, By, WebDriver, Locator, WebElementPromise, WebElement } from 'selenium-webdriver';

export class Livequiz {
    browser!: WebDriver;
    static async init(url = 'http://localhost:4200'): Promise<Livequiz> {
        const lq = new Livequiz();
        lq.browser = await new Builder().forBrowser(Browser.CHROME).build();
        await lq.browser.get(url);
        await Livequiz.wait(300);
        return lq;
    }

    static async reset(): Promise<Livequiz> {
        return Livequiz.init('http://localhost:4200#reset');
    }

    static async wait(ms: number) {
        await new Promise((resolve) => setTimeout(resolve, ms));
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
export class WEP {
    constructor(private p: WebElementPromise) { }

    async click() {
        await (await this.p).click();
    }
    async sendKeys(t: string) {
        await (await this.p).sendKeys(t);
    }
    async clear() {
        await (await this.p).clear();
    }
    async find(): Promise<WebElement> {
        return await this.p;
    }
}

