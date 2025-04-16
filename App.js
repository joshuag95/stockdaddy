require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const stocks = {
  AAPL: { lastPrice: null },
  TSLA: { lastPrice: null },
  AMZN: { lastPrice: null },
};

const fetchStockPrice = async (symbol) => {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.API_KEY}`;
  try {
    const res = await axios.get(url);
    const price = parseFloat(res.data["Global Quote"]["05. price"]);
    return price;
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err.message);
    return null;
  }
};

const checkPrices = async () => {
  for (const symbol in stocks) {
    const current = await fetchStockPrice(symbol);
    const last = stocks[symbol].lastPrice;

    if (current && last) {
      const change = ((current - last) / last) * 100;
      if (Math.abs(change) >= 5) {
        const message = `⚠️ ${symbol} has changed by ${change.toFixed(2)}%! Price: $${current}`;
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        channel.send(message);
      }
    }

    stocks[symbol].lastPrice = current;
  }
};

// Run every 5 minutes
setInterval(checkPrices, 1000 * 60 * 5);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkPrices(); // Check right away on start
});

client.login(process.env.DISCORD_TOKEN);
