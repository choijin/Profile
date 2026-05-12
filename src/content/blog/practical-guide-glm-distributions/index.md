---
title: "A Practical Guide to GLM Distributions"
description: "A note on binomial, Poisson, gamma, inverse Gaussian, chi-square, and Tweedie distributions in modeling."
date: "2026-05-11"
category: "Data Science"
tags: ["GLM", "Distributions", "Statistics"]
---

Choosing a GLM distribution is really choosing what kind of response variable you believe you are modeling. The distribution defines the shape of the conditional response and the mean-variance relationship the model expects.

## Binomial

The binomial distribution is used when the response is a count of successes out of a fixed number of trials. In binary classification, the common special case is one trial with success probability `p`.

In a GLM, this often appears with a logit link. The model estimates the probability of an event, such as default, churn, or claim occurrence.

## Poisson

The Poisson distribution is used for count data. Its key assumption is that the mean and variance are equal.

That assumption is often too strict in real data. If the variance is larger than the mean, the data is overdispersed. Overdispersion can happen when observations are not independent, when important predictors are missing, or when the true process varies across subgroups.

## Gamma

The gamma distribution is useful for positive continuous outcomes that are skewed to the right. It is commonly used for severity-type targets where values are strictly positive and large outcomes are possible.

In a GLM, gamma is often paired with a log link so predictions remain positive and effects become multiplicative.

## Inverse Gaussian

The inverse Gaussian distribution is also used for positive skewed outcomes, but it assumes a different variance relationship than gamma. A practical way to compare them is to look at how variance changes with the mean across groups.

Gamma can be a good fit when variance grows roughly with the square of the mean. Inverse Gaussian can be useful when variance grows more sharply.

## Chi-square

The chi-square distribution appears naturally in model comparison and inference. In GLMs, deviance differences can be compared using chi-square logic, especially in likelihood ratio tests.

That makes it more of an evaluation and testing distribution than a response distribution in most day-to-day modeling work.

## Tweedie

The Tweedie family is especially useful when the response is nonnegative, has many zeros, and has positive continuous values when nonzero.

This makes it attractive in insurance, where total loss can be zero for many policies but positive and skewed when a claim occurs. Between power parameters 1 and 2, Tweedie behaves like a compound Poisson-gamma process: a random number of events, each with a random severity.

## The modeling question

The practical question is not "which distribution is best?" in the abstract. It is:

- Is the target binary, count, positive continuous, or zero-inflated continuous?
- How does variance change as the mean changes?
- Does the model need probabilities, counts, severities, or pure premium?
- Are the assumptions useful enough for the business problem?

That framing keeps distribution choice tied to the data-generating process instead of treating it like a menu of technical options.
