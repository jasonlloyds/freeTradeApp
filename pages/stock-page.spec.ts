import {test, expect} from '@playwright/test';
import {StockPage} from '../tests/StockPage';

test.describe('Stock Page - Unautheticated Mode', () => {
    test('Interactive Chart switching with Time range and Overlays', async ({page}) => {
        const stockPage = new StockPage(page);

        await page.goto('/universe/US/TSLA');
        await stockPage.acceptCookies();
        
        //Navigate to stock page
        await stockPage.verifyLineChartDisplayed();

        await stockPage.selectTimeRangeOption('1W');
        await stockPage.verifyChartStartDate('1W');

        await stockPage.selectTimeRangeOption('1M');
        await stockPage.verifyChartStartDate('1M');

        await stockPage.selectTimeRangeOption('3M');
        await stockPage.verifyChartStartDate('3M');

        await stockPage.selectTimeRangeOption('6M');
        await stockPage.verifyChartStartDate('6M');

        await stockPage.selectTimeRangeOption('1Y');
        await stockPage.verifyChartStartDate('1Y');

        await stockPage.selectTimeRangeOption('5Y');
        await stockPage.verifyChartStartDate('5Y');

    });

    test('Search Functionality for Exact Stock Ticker with Page Verification', async ({ page }) => {
        const stockPage = new StockPage(page);

        // Navigate to homepage or search page
        await page.goto('/universe/US/TSLA');
        await stockPage.acceptCookies();

        // Search for exact ticker
        await stockPage.searchForStock('AAPL');
        await stockPage.selectStockResult();
        await stockPage.verifyStockPage('AAPL');

        // Search for another exact ticker
        await stockPage.searchForStock('TSLA');
        await stockPage.selectStockResult();
        await stockPage.verifyStockPage('TSLA');

        // Search for another exact ticker
        await stockPage.searchForStock('META');
        await stockPage.selectStockResult();
        await stockPage.verifyStockPage('META');

        //searching error handling
        await stockPage.searchForStock('INVALIDSYM');
        await stockPage.returnCorrectNotFoundMessage();
  });

    test('Unauthenticated User will not be able to purchase Stock', async ({ page }) => {
        const stockPage = new StockPage(page);

        // Navigate to stock page
        await page.goto('/universe/US/TSLA');
        await stockPage.acceptCookies();

        await stockPage.searchForStock('NVDA');
        await stockPage.selectStockResult();
        await stockPage.verifyStockPage('NVDA');

        await stockPage.verifyPurchaseBoxDisplayed();
        await stockPage.enterAmountInBuyBox('10');
        await stockPage.verifyBuyButtonDisabled();
    });

});
  