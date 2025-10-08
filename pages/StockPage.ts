import {Page, Locator, expect} from '@playwright/test';

export class StockPage {
  readonly page: Page;
  readonly chart: Locator;
  readonly chartTypeSelector: Locator;
  readonly timeRangeSelector: Locator;
  readonly searchInput: Locator;
  readonly searchBar: Locator;
  readonly firstResult: Locator;
  readonly companyName: Locator;
  readonly purchaseBox: Locator;
  readonly amountInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chart = this.page.locator('.h-full.flex-1.min-h-1');
    this.chartTypeSelector = this.page.getByLabel('Chart Type');
    this.timeRangeSelector = this.page.locator('#flex gap-x-200');
    this.searchBar = this.page.getByText('Search', { exact: true });
    this.searchInput = this.page.locator('input[ft-id="search-input"]');
    this.firstResult = this.page.locator('[ft-id^="search-result-item-"]').first();
    this.companyName = this.page.locator('//span[contains(@class, "text-text-secondary") and contains(@class, "text-body-sm")]').first();
    this.purchaseBox = this.page.locator('aside[class*="grid-area:sidebar"]');
    this.amountInput = this.page.locator('input[ft-id="trading-input-amount-input"]');
  }

    async verifyLineChartDisplayed(){
    try {
        await expect(this.chart).toBeVisible({timeout:5000});
    } catch (error) {
        throw new Error(`Line chart not displayed correctly: ${error}`);
        }
    }

//new

    async selectTimeRangeOption(option: string) {
    try {
        // Target the specific button by its text/role
        const timeRangeButton = this.page.getByRole('button', { name: option, exact: true });
        await timeRangeButton.click();

        // Wait for the button to become active (e.g., data-state="active")
        await this.page.waitForFunction((opt) => {
            const activeButton = document.querySelector(`button[data-state="active"]`);
            return activeButton && activeButton.textContent === opt;
        }, option, { timeout: 5000, polling: 100 });
    } catch (error) {
        throw new Error(`Failed to select time range option "${option}": ${error}`);
        }
    }

    async acceptCookies() {
        try{
        // Wait for the cookie popup to appear and click the Accept button
        const acceptButton = this.page.getByRole('button', { name: /Accept|Accept Cookies|Agree/i, exact: false });
        await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
        await acceptButton.click();
        await this.page.waitForLoadState('networkidle'); // Ensure page loads after acceptance
        } catch (error) {
        // If the popup doesn't appear, we can ignore the error
        console.log('Cookie acceptance not required or failed:', error);
        }
    }
    
    async verifyChartStartDate(range: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y') {
        const now = new Date();
        const daysToSubtract: { [key in '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y']: number } = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '5Y': 1825,
        };

        const oneRangeAgo = new Date(now);
        oneRangeAgo.setDate(now.getDate() - daysToSubtract[range]);

        if(oneRangeAgo.getHours() < 2 || oneRangeAgo.getHours() >= 23){
            oneRangeAgo.setDate(oneRangeAgo.getDate() - 1); //Shift to previous day if outside trading hours
        }
        const expectedStartDateStr = oneRangeAgo.toISOString().split('T')[0];

        // Hover to bottom left corner (x: left edge, y: bottom edge)
        await this.chart.waitFor({ state: 'visible', timeout: 5000 });
        // Get the bounding box of the chart
        const box = await this.chart.boundingBox();

        if (box) {
        // Calculate bottom-left corner
        const x = box.x + 10; // +1 to avoid edge cases
        const y = box.y + box.height - 1;

        // Move mouse to that position
        await this.page.mouse.move(x, y);
        }

        // Check for SVG tooltip or axis within the chart
        const earliestDate = await this.page.evaluate((chartSelector: string) => {
        const chart = document.querySelector(chartSelector);
        if (!chart) return null;

        const svg = chart.querySelector('svg');
        if (!svg) return null;    

        // Target the <text> element with the date
        const expectedYear = new Date().getFullYear();
        const dateText = svg.querySelector('text[font-family="var(--dm-mono)"][font-size="12"][text-anchor="middle"]');
        if (dateText && dateText.textContent) {
            const [day, month, timeOrYear] = dateText.textContent.split(' ');
            const monthMap = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthKey = month.toUpperCase() as keyof typeof monthMap;
            const monthNum = monthMap[monthKey];
            let year = expectedYear;
            if (timeOrYear && /^\d{4}$/.test(timeOrYear)) {
                year = Number(timeOrYear);
            }
            if (monthNum) {
            return `${year}-${monthNum}-${day.padStart(2, '0')}`;
            }
        }
        return null;
        }, `.h-full.flex-1.min-h-1`);

        if (!earliestDate) {
        throw new Error(`Could not extract chart start date for range ${range}`);
        }
        const dateDiff = Math.abs(new Date(earliestDate).getTime() - new Date(expectedStartDateStr).getTime()) / (1000 * 60 * 60 * 24);
        await expect(dateDiff).toBeLessThanOrEqual(3);
        console.log(`Range ${range}: Verified chart starts around ${earliestDate}, expected ~${expectedStartDateStr}`);
    }       

    async searchForStock(query: string) {
        try{
        await this.searchBar.waitFor({ state: 'visible', timeout: 5000 }); // 
        await this.searchBar.click();
        await this.searchInput.waitFor({ state: 'visible', timeout: 5000 }); // 
        await this.searchInput.fill(query);
        } catch (error) {
        throw new Error(`Failed to search for stock "${query}": ${error}`);
        }
    }

    async selectStockResult(){
        try{
        await this.firstResult.click();
        await this.chart.waitFor({ state: 'visible', timeout: 10000 });
        } catch (error) {
        throw new Error(`Failed to select first stock result: ${error}`);
        }
    }

    async verifyStockPage(stock: string) {
        try{
        const symbolRegex = new RegExp(`/universe/US/${stock}`, 'i');
        await expect(this.page).toHaveURL(symbolRegex);
        await this.companyName.waitFor({ state: 'visible', timeout: 10000 });
        await expect.poll(async () => await this.companyName.getByText(stock).isVisible(), { timeout: 10000 }).toBeTruthy();
        await expect(this.chart).toBeVisible();
        } catch (error) {
        throw new Error(`Stock page verification failed for "${stock}": ${error}`);
        }
    }

    async returnCorrectNotFoundMessage() {
        try{
        const notFoundMessage = this.page.getByText(`Didn't find what you were looking for?`, { exact: true });
        await notFoundMessage.waitFor({ state: 'visible', timeout: 5000 });
        let errorOccurred = false;
        await new Promise((resolve) => {
        this.page.on('pageerror', (error) => {
            console.log('Page error caught:', error);
            errorOccurred = true;
        });
        setTimeout(resolve, 2000); // Allow 2 seconds to catch errors
        });
        await expect(errorOccurred).toBe(false);
        } catch (error) {
        throw new Error(`Not found message verification failed: ${error}`);
        }
    }

    async verifyPurchaseBoxDisplayed(){
        try{
        await expect(this.page.getByText('Buy', { exact: true })).toBeVisible({timeout:5000});
        } catch (error) {
        throw new Error(`Purchase box not displayed correctly: ${error}`);
        }
    }

    async enterAmountInBuyBox(amount: string){
        try{
        await this.amountInput.fill(amount);}
        catch (error) {
        throw new Error(`Failed to enter amount "${amount}" in buy box: ${error}`);
        }
    }

    async verifyBuyButtonDisabled(){
        try{
        const buyButton = this.page.getByRole('button', { name: 'Buy', exact: true });
        await expect(buyButton).toBeVisible({ timeout: 5000 });
        const initialUrl = this.page.url();
        await buyButton.click({ force: true }); // Force click if overlaid
        await this.page.waitForTimeout(2000); // Wait for any response
        return { initialUrl };
        } catch (error) {
        throw new Error(`Buy button should be disabled but click succeeded: ${error}`);
        }
    }
}