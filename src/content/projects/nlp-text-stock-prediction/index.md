---
title: "NLP Text Stock Prediction"
description: "Stock price prediction using LSTM and BERT models to analyze daily news headlines and forecast stock movement."
date: "2025-09-01"
demoURL: "https://choijin.github.io/NLP_Text_Stock_Prediction/"
---

![NLP Text Stock Prediction](./nlp_text_stock_prediction.png)

This project uses LSTM and BERT models to analyze the context of daily news headlines for stock movement forecasting.

- Aggregated and processed over 100,000 news articles, aligning them with historical stock data from the S&P 500.
- Developed a baseline LSTM model using stock data and an advanced hybrid model combining LSTM with BERT embeddings of news headlines.
- Implemented a custom tokenization strategy to handle BERT token limits and create daily news embeddings representing each day's context.
