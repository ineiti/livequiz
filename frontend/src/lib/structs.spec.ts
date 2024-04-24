import { OptionRegexp } from "./structs";

describe('Structs', () => {
    it('OptionRegexp filters and matches correctly', async () => {
        const or = new OptionRegexp({
            replace: ["s/ //g", "s/;//"],
            match: ["/^one$/i", "/^two$/"]
        });
        expect(or.isCorrect("one")).toBeTrue();
        expect(or.isCorrect("One")).toBeTrue();
        expect(or.isCorrect(" one ")).toBeTrue();
        expect(or.isCorrect("one;")).toBeTrue();
        expect(or.isCorrect(";one;")).toBeFalse();
        expect(or.isCorrect("two")).toBeTrue();
        expect(or.isCorrect("Two")).toBeFalse();
    });
});  