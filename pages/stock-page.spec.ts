import {test, expect} from '@playwright/test';
import {StockPage} from '../tests/StockPage';

test.describe('Stock Page - Unautheticated Mode', () => {
    test('Switching from line chart to candlestick chart', async ({page}) => {
        const stockPage = new StockPage(page);

        //Navigate and verify line chart is displayed
        await stockPage.navigationToStock('TSLA');
        await stockPage.verifyLineChartDisplayed();

        //Switch to candlestick chart and verify
        await stockPage.switchToCandlestickChart();
        await stockPage.setTimeRange('1M');
        await stockPage.addVolumeOverlay();
        await stockPage.hoverOnCandlestick();

        //Verify candlestick chart is displayed
        await stockPage.verifyCandlestickChartDisplayed();
    });

    test('Handling invalid stock symbol with suggestion', async ({page}) => {
        const stockPage = new StockPage(page);

    
        //Navigate to invalid stock symbol and verify suggestion
        await stockPage.navigationToStock('INVALIDSYM');
        await stockPage.verifySuggestion('TSLA');
        await stockPage.selectSuggestion();
        await stockPage.verifyStockDetails('TSLA');
        await stockPage.verifyNoCrash();

        //Test delisted stock symbol
        await stockPage.searchForStock('Twitter');
        await stockPage.verifyErrorMessage();
        await stockPage.verifyNoCrash();

        //Test valid query
        await stockPage.searchForStock('TSLA');
        await stockPage.verifyStockDetails('TSLA');
        await stockPage.verifyNoCrash();
    });

    test('Search with dynamic filtering and pagination', async ({page}) => {
        const stockPage = new StockPage(page);

        //Navigate to search page
        await page.goto('/search');

        //Seach and select stock
        await stockPage.searchForStock('TSLA');
        await stockPage.verifyStockDetails('TSLA');
        await stockPage.selectStock('TSLA');

        //Filter historical data for last month
        await stockPage.setTimeRange('1M');
        await stockPage.verifyHistoricalDataLoaded('1M');

        //Increase time range to last year
        await stockPage.setTimeRange('1Y');
        await stockPage.verifyHistoricalDataLoaded('1Y');
        
        //If pagination exists, navigate to next page and verify data loads
        while (await stockPage.hasMorePages()) {
        await stockPage.navigateToNextPage();
        await stockPage.verifyHistoricalDataLoaded('1Y');
        }

    });
});
  