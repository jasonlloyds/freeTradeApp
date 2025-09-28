import {Page, Locator, expect} from '@playwright/test';

export class StockPage {
  readonly page: Page;
  readonly chart: Locator;
  readonly chartTypeSelector: Locator;
  readonly timeRangeSelector: Locator;
  readonly volumeOverlay: Locator;
  readonly lineChartIndicator: Locator;
  readonly candlestickChartIndicator: Locator;
  readonly tooltipData: Locator;
  readonly premiumIndicator: Locator;
  readonly searchInput: Locator;
  readonly suggestion: Locator;
  readonly errorMessage: Locator;
  readonly stockResult: Locator;
  readonly historicalData: Locator;
  readonly nextPageButton: Locator;
  readonly dataRows: Locator

  constructor(page: Page) {
    this.page = page;
    this.chart = this.page.locator('#stock-chart');
    this.chartTypeSelector = this.page.getByLabel('Chart Type');
    this.timeRangeSelector = this.page.getByLabel('Time Range');
    this.volumeOverlay = this.page.getByRole('button', { name: 'Add Volume' });
    this.lineChartIndicator = this.page.getByRole('button', { name: /Line Chart/i });
    this.candlestickChartIndicator = this.page.getByRole('button', { name: /Candlestick Chart/i });
    this.tooltipData = this.chart.getByText(/Open|High|Low|Close/);
    this.premiumIndicator = this.page.getByText(/premium indicator/i);
    this.searchInput = this.page.getByPlaceholder('Search stocks');
    this.suggestion = this.page.getByText(/Did you mean/i);
    this.errorMessage = this.page.getByText(/Stock not found|not available/i);
    this.stockResult = this.page.getByTestId('stock-result');
    this.historicalData = this.chart.locator('.historical-data');
    this.nextPageButton = this.page.getByRole('button', { name: 'Next Page' });
    this.dataRows = this.historicalData.locator('tr');
  }

    async navigationToStock(stockSymbol: string) {
    try {
        await this.page.goto(`/stocks/${stockSymbol}`);
        await this.page.waitForURL(`**/stocks/${stockSymbol}`, { timeout: 10000 });
        await this.page.waitForResponse(
            response => response.url().includes(`/api/stocks/${stockSymbol}`) && response.status() === 200,
            { timeout: 10000 }
        );
    } catch (error) {
        throw new Error(`Failed to navigate to stock "${stockSymbol}": ${error}`);
    }
}

    async selectStock(stockSymbol: string) {
    try {
        await this.page.getByText(stockSymbol).first().click();
        await this.page.waitForURL(`**/stocks/${stockSymbol}`, { timeout: 10000 });
    } catch (error) {
        throw new Error(`Failed to select stock "${stockSymbol}": ${error}`);
    }
}

    async setHistoricalTimeRange(range: string) {
    try {
        await this.timeRangeSelector.selectOption(range);
        await this.page.waitForFunction(() => {
            const data = document.querySelector('.historical-data');
            return data && data.classList.contains(`range-${range.toLowerCase()}`);
        }, null, { timeout: 5000, polling: 100 });
    } catch (error) {
        throw new Error(`Failed to set historical time range "${range}": ${error}`);
    }
}

    async verifyHistoricalDataLoaded(range: string) {
    try {
        const startTime = Date.now();
        await expect(this.historicalData).toBeVisible({ timeout: 10000 });
        await expect(this.historicalData).toContainText(/Open|Close|Volume/);
        const expectedRows = range === '1M' ? [20, 22] : [240, 260];
        const rowCount = await this.historicalData.locator('tr').count();
        expect(rowCount).toBeGreaterThanOrEqual(expectedRows[0]);
        expect(rowCount).toBeLessThanOrEqual(expectedRows[1]);
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000);
    } catch (error) {
        throw new Error(`Historical data failed to load for range "${range}": ${error}`);
    }
}

    async navigateToNextPage(){
        if (await this.nextPageButton.isVisible()) {
            await this.nextPageButton.click();
            await this.page.waitForFunction(() => document.querySelectorAll('.data-row').length > 0,
                null,
                {timeout: 5000, polling: 100}
            );
        }
    }

    async hasMorePages() {
    return (await this.nextPageButton.isVisible()) && (await this.nextPageButton.isEnabled());
    }

    async searchForStock(stockSymbol:string){
        await this.searchInput.fill(stockSymbol);
        await this.searchInput.press('Enter');
        await this.page.waitForResponse(response => response.url().includes('/api/stocks') &&  [200,404].includes(response.status()),
            {timeout: 10000});
    }

    async selectSuggestion(){
        await this.suggestion.click();
        await this.page.waitForFunction(() => document.querySelector('[data-testid="stock-result"]') !== null,
            null,
            {timeout: 5000, polling: 100}
        );
    }

    async verifySuggestion(stockSymbol:string){
        await expect(this.suggestion).toBeVisible({timeout: 5000});
        await expect(this.suggestion).toHaveText(new RegExp(`Do you mean.*${stockSymbol}.*`),{timeout: 5000});
    }
    
    async verifyErrorMessage(){
        await expect(this.errorMessage).toBeVisible({timeout: 5000});
    }

    async verifyStockDetails(stockSymbol:string){
        await expect(this.stockResult).toBeVisible({timeout: 5000});
        await expect(this.stockResult).toHaveText(new RegExp(stockSymbol),{timeout: 5000});
    }

    async verifyNoCrash(){
        await expect(this.page).not.toHaveURL(/error|500/);
        await expect(this.page.locator('body')).toBeVisible();
    }

    async switchToCandlestickChart(){
        await this.chartTypeSelector.selectOption('candlestick');
        await this.page.waitForFunction(() => {
            const chart = document.querySelector('#stock-chart');
            return chart && chart.classList.contains('candlestick');
        },
        null,
        {timeout: 5000, polling: 100}
        );
    }

    async setTimeRange(range: string){
    try {
        await this.timeRangeSelector.selectOption(range);
    } catch (error) {
        throw new Error(`Failed to set time range "${range}": ${error}`);
    }
}

    async addVolumeOverlay(){
    try {
        await this.volumeOverlay.click();
    } catch (error) {
        throw new Error(`Failed to add volume overlay: ${error}`);
    }
}

    async hoverOnCandlestick(){
    try {
        await this.page.evaluate(() => {
            const candle = document.querySelector('.candlestick .candle');
            if (candle) {
                const hoverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
                candle.dispatchEvent(hoverEvent);
            }
        });
    } catch (error) {
        throw new Error(`Failed to hover on candlestick: ${error}`);
    }
}

    async verifyLineChartDisplayed(){
    try {
        await expect(this.chart).toBeVisible({timeout:5000});
        await expect(this.lineChartIndicator).toBeVisible({timeout: 5000});
    } catch (error) {
        throw new Error(`Line chart not displayed correctly: ${error}`);
    }
}

    async verifyCandlestickChartDisplayed(){
    try {
        await expect(this.candlestickChartIndicator).toBeVisible({timeout: 5000});
        await expect(this.tooltipData).toBeVisible({timeout: 5000});
        await expect(this.volumeOverlay).toBeVisible({timeout: 5000});
        await expect(this.premiumIndicator).not.toBeVisible({timeout: 5000});
    } catch (error) {
        throw new Error(`Candlestick chart not displayed correctly: ${error}`);
    }
}
}