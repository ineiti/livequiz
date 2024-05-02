import { Builder, Browser, By, WebDriver, Locator, WebElementPromise } from 'selenium-webdriver';

export class Livequiz {
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
export class WEP {
    constructor(private p: WebElementPromise) { }

    async click() {
        await (await this.p).click();
    }
    async sendKeys(t: string) {
        await (await this.p).sendKeys(t);
    }
}

