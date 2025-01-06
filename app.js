const apiKey = 'NG8Q42ZLEVNXUZHA';
const twitterBearerToken = 'AAAAAAAAAAAAAAAAAAAAAHCGxwEAAAAAAgPM7S%2BP0q3y0x8CxlGbd60hxS8%3D9E7M92AgHlioOo53mNA2ffOv1ncZAnqf5ZpWLkr9tYGV8Xhq7L'; 

let stockData = [];
let sentimentData = [];

document.getElementById('searchButton').addEventListener('click', function() {
    const stockSymbol = document.getElementById('stockSymbol').value.trim().toUpperCase();
    
    if (!stockSymbol) {
        alert('Please enter a stock symbol!');
        return;
    }

    fetchStockData(stockSymbol);
    fetchSentimentData(stockSymbol);
});

function fetchStockData(stockSymbol) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${stockSymbol}&interval=5min&apikey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Log the API response for debugging
            if (data['Error Message']) {
                alert('Error fetching stock data: ' + data['Error Message']);
                return;
            }

            const timeSeries = data['Time Series (5min)'];
            if (!timeSeries) {
                alert('Error: Unable to fetch stock data or invalid stock symbol!');
                return;
            }

            stockData = Object.keys(timeSeries).map(time => ({
                time: time,
                price: parseFloat(timeSeries[time]['4. close'])
            }));

            displayStockPrice(stockSymbol);
            renderStockChart();
        })
        .catch(error => console.error('Error fetching stock data:', error));
}

function displayStockPrice(stockSymbol) {
    const latestStock = stockData[0];
    document.getElementById('stockPrice').textContent = `Stock Price (${stockSymbol}): $${latestStock.price.toFixed(2)}`;
}

function renderStockChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    const stockLabels = stockData.map(item => item.time);
    const stockPrices = stockData.map(item => item.price);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: stockLabels,
            datasets: [{
                label: 'Stock Price',
                data: stockPrices,
                borderColor: 'rgba(0, 123, 255, 1)',
                fill: false
            }]
        }
    });
}

function fetchSentimentData(stockSymbol) {
    const query = encodeURIComponent(stockSymbol);
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=created_at&max_results=100`;

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${twitterBearerToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data); // Log the sentiment data for debugging
            if (!data.data) {
                alert('No tweets found for the given stock symbol!');
                return;
            }

            const sentiments = data.data.map(tweet => analyzeSentiment(tweet.text));
            sentimentData = sentiments;
            displaySentimentScore();
            renderSentimentChart();
        })
        .catch(error => console.error('Error fetching tweets:', error));
}

function analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'up', 'positive', 'strong'];
    const negativeWords = ['bad', 'down', 'negative', 'decline', 'weak'];
    let sentimentScore = 0;

    positiveWords.forEach(word => {
        if (text.toLowerCase().includes(word)) sentimentScore += 1;
    });

    negativeWords.forEach(word => {
        if (text.toLowerCase().includes(word)) sentimentScore -= 1;
    });

    return sentimentScore;
}

function displaySentimentScore() {
    const averageSentiment = sentimentData.reduce((sum, sentiment) => sum + sentiment, 0) / sentimentData.length;
    let sentimentText = 'Neutral';

    if (averageSentiment > 0) sentimentText = 'Positive';
    else if (averageSentiment < 0) sentimentText = 'Negative';

    document.getElementById('sentimentScore').textContent = `Sentiment: ${sentimentText} (Score: ${averageSentiment.toFixed(2)})`;
}

function renderSentimentChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    const sentimentLabels = sentimentData.map((_, index) => `Tweet ${index + 1}`);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sentimentLabels,
            datasets: [{
                label: 'Sentiment Score',
                data: sentimentData,
                borderColor: 'rgb(255, 117, 99)',
                fill: false
            }]
        }
    });
}
