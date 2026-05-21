---
title: "How GLMs Work"
description: "A practical walkthrough of GLM likelihood, link functions, mean-variance relationships, deviance, dispersion, and optimization."
date: "2026-05-13"
category: "Data Science"
tags: ["GLM", "Statistics", "Modeling"]
---

Here are my notes on GLM, and why it is commonly used. First, GLM is an interpretable model that is used in industries with heavy regulation. Also, it is a very flexible model because you can pick the family of distribution that fits the taret.

To begin, GLM is modeling the conditional mean, but it does so through a **distribution** and a **link function**.

```text
mu_i = E[Y_i | X_i]
g(mu_i) = eta_i = X_i beta
```

The model is not just predicting a number, but it is assuming a probability distribution for `Y_i` around the mean `mu_i`.

## What makes a GLM different from OLS

The key differences are:

* GLMs do not assume homoscedasticity (constant variance), since variance depends on the mean.
* GLMs do not assume normality of residuals but instead assume an appropriate distribution from the exponential family.
* GLMs use Maximum Likelihood Estimation (MLE) rather than minimizing squared errors.

For a chosen distribution, link function, and coefficient vector, the model implies a mean for each observation. That mean, along with the dispersion parameter and variance function, implies a probability distribution for the observed outcome.

For each row, the model assigns a probability or density to the actual observed `y_i`. Multiplying those values across all rows gives the **likelihood**.

```text
L(beta) = product over i of f(y_i | mu_i, phi)

log L(beta) = sum over i of log f(y_i | mu_i, phi)
```

GLM is fit by finding the set of parameters for which the likelihood (log-likelihood to simplify) is the highest.

```text
beta_hat = argmax_beta log L(beta)
```

## The exponential family

GLMs rely on distributions from the exponential family. A distribution belongs to the exponential family if its density or mass function can be written in this general form:

```text
f(y | theta, phi)
  = exp((y * theta - b(theta)) / a(phi) + c(y, phi))
```

Normal, Poisson, binomial, gamma, and inverse Gaussian distributions all fit into this form.

That shared structure is what lets GLMs use a unified fitting and inference approach.

Some distributions have convenient closed-form densities. Poisson, gamma, and normal distributions are examples. Tweedie with `1 < p < 2` is more awkward because the density does not have a simple closed form.

This is where the mean-variance relationship becomes important.

## The mean-variance relationship

In GLMs, variance is written as a function of the mean:

```text
Var(Y_i) = phi * V(mu_i)
```

For the power variance family, the variance function is:

```text
Var(Y_i) = phi * mu_i^p
```

where:

- `mu_i = E[Y_i | X_i]`
- `phi` is the dispersion parameter
- `p` is the variance power

This one formula connects several familiar distributions:

```text
p = 0  -> Gaussian-like
p = 1  -> Poisson
1 < p < 2 -> Tweedie compound Poisson-gamma
p = 2  -> Gamma
p = 3  -> Inverse Gaussian
```

This is why GLMs do not need homoscedasticity in the OLS sense. The variance is allowed to change with the expected value.

In insurance, this is a big deal. A policy with a higher expected loss should usually also have higher uncertainty. GLMs let the variance grow with the mean instead of forcing a constant variance assumption.

## The distributions I usually think about

The distribution describes what kind of response variable I believe I am modeling, and how the variance should behave as the expected value changes.

**Binomial** is for successes out of a fixed number of independent trials.

```text
Y ~ Binomial(n, p)

E[Y] = np
Var(Y) = np(1 - p)
```

When `n = 1`, it becomes Bernoulli. That is the setup behind logistic regression.

```text
Y ~ Bernoulli(p)

logit(p) = log(p / (1 - p)) = X beta
p = exp(X beta) / (1 + exp(X beta))
```

The logit link is needed because probability has to stay between 0 and 1, while the linear predictor can be any real number.

**Poisson** is for counts: number of claims, calls, events, or arrivals in a fixed interval of time, space, or exposure.

```text
Y ~ Poisson(lambda)

E[Y] = lambda
Var(Y) = lambda
```

For insurance frequency, I would usually model claim count as the target and use exposure as an offset:

```text
log(E[claim_count_i]) = X_i beta + log(exposure_i)
```

The strict Poisson assumption is that the mean and variance are equal. Real data often has overdispersion:

```text
Var(Y) > E[Y]
```

When this happens, the model can understate uncertainty, which makes standard errors and p-values look more confident than they should.

**Negative binomial** is useful for overdispersed count data. I think of it as a Poisson model where the rate itself varies across observations.

```text
E[Y] = mu
Var(Y) = mu + alpha * mu^2
```

For frequency modeling, the target should still be a count, not a rate. Use count as the target and `log(exposure)` as the offset. Dividing by exposure can break the distributional assumption because negative binomial does not have the same pure power variance form as Poisson, gamma, or Tweedie.

**Gamma** is useful for positive, continuous, right-skewed outcomes. This is why it is commonly used for severity.

```text
E[Y] = mu
Var(Y) = phi * mu^2
```

The variance grows quadratically with the mean, which is a reasonable pattern for many claim amount problems.

**Inverse Gaussian** is also positive and right-skewed, but it has a sharper peak and heavier tail than gamma.

```text
E[Y] = mu
Var(Y) = phi * mu^3
```

I would consider it when variance grows more aggressively than the gamma relationship suggests.

**Chi-square** is not usually the response distribution I am choosing for a GLM. I think of it more as an inference distribution.

```text
chi^2_k = Z_1^2 + Z_2^2 + ... + Z_k^2

E[chi^2_k] = k
Var(chi^2_k) = 2k
```

In GLMs, chi-square logic shows up when comparing nested models:

```text
Delta D = 2 * (log L_full - log L_reduced)
Delta D ~ chi^2_q
```

where `q` is the difference in the number of parameters.

## Why Tweedie matters in insurance

I learned that in the real world, the assumption that the target follows a normal distribution is often violated. In insurance, the target often has an awkward shape: many policies have zero loss, and the policies that do have loss are positive, skewed, and sometimes very large.

Tweedie is commonly used in insurance because it is built for data that is nonnegative, right-skewed, and contains exact zeros.

For `1 < p < 2`, Tweedie can be understood as a compound Poisson-gamma process:

```text
N ~ Poisson(lambda)
X_i ~ Gamma(alpha, theta)

Y = sum_{i=1}^{N} X_i
```

If there are no claims, total loss is zero:

```text
If N = 0, then Y = 0
```

If there is one claim, total loss is one gamma-like severity. If there are several claims, total loss is the sum of those severities.

This matches pure premium thinking:

```text
Pure premium = frequency * severity
```

Tweedie gives one model for the total loss outcome directly:

```text
E[Y] = mu
Var(Y) = phi * mu^p
```

The tradeoff is interpretability. Tweedie models pure premium directly, so frequency and severity are blended. A variable might increase claim frequency but decrease severity, or barely affect frequency but strongly affect severity. If I only model pure premium, those stories can get blurred.

That is why separate frequency and severity models can still be useful:

```text
Frequency model:
E[claim_count] or E[claim_count / exposure]

Severity model:
E[claim_amount | claim occurred]

Pure premium:
frequency * severity
```

Tweedie is a strong baseline when the target shape is the main issue. Separate frequency/severity models are better when I need to understand the mechanism.

## Why the log link is so useful

A link function connects the conditional mean to the linear predictor.

```text
g(mu_i) = eta_i = X_i beta
```

With a log link:

```text
log(mu_i) = X_i beta
mu_i = exp(X_i beta)
```

This is useful because it keeps predictions positive. It also makes the model multiplicative on the original mean scale.

If:

```text
log(mu_i) = beta_0 + beta_1 x_1 + beta_2 x_2
```

then:

```text
mu_i = exp(beta_0) * exp(beta_1 x_1) * exp(beta_2 x_2)
```

That matches how many insurance pricing systems already think:

```text
Premium = Base Rate * Rating Factor 1 * Rating Factor 2 * ...
```

So each predictor contributes a multiplicative term to the expected premium, pure premium, frequency, or severity.

For a one-unit increase in `x_j`, the expected response is multiplied by:

```text
exp(beta_j)
```

That is why a log-link GLM often feels more natural in pricing than an additive model.

## Prediction is the mean of a distribution

One of the most important points from my note is that a GLM prediction is the mean of a distribution, not a guaranteed observed value.

The model predicts:

```text
mu_i = E[Y_i | X_i] = g^-1(X_i beta)
```

But `Y_i` is still a random variable.

For each row, the model assumes a conditional distribution:

```text
Y_i | X_i ~ chosen distribution with mean mu_i
```

So the coefficient vector does not just produce one fitted value. It defines a conditional probability distribution centered at `mu_i`, with variance determined by the distribution and dispersion parameter.

That distinction matters. If a Poisson GLM predicts `0.20` claims, it is not saying a policy literally has one-fifth of a claim. It is saying the expected count is `0.20`, and the actual observed count is random around that mean.

## Optimization: how GLMs are fit

GLMs are usually fit by solving the score equation:

```text
U(beta) = 0
```

Conceptually, this is similar to taking the derivative of the log-likelihood and setting it to zero.

But one thing I want to remember is that GLMs do not always require the full closed-form PDF. GLM theory can use the mean-variance relationship, leading to a quasi-score or estimating equation.

That is why Tweedie GLM can still work even when the PDF has no simple closed form. When the PDF exists, we can write the true likelihood. When it does not, the fitting can still rely on the mean-variance structure.

## Deviance as a loss function

GLM fits the model using maximum likelihood, and deviance is a common loss function for GLMs.

Deviance measures how well a GLM fits the data by comparing the fitted model to a saturated model.

The saturated model is a hypothetical model that perfectly fits every observation. The fitted model is the GLM we actually estimated.

```text
Residual deviance =
2 * (log L_saturated - log L_fitted)
```

Smaller deviance means the fitted model is closer to the saturated model.

There is also a null model, which uses only an intercept and no predictors.

```text
Null model: intercept only
Fitted model: intercept + predictors
Saturated model: perfect fit
```

The null deviance measures how poorly the intercept-only model fits. The residual deviance measures how much lack of fit remains after adding predictors.

The difference between null deviance and residual deviance is sometimes treated as the amount of deviance explained by the model:

```text
Total deviance = Null deviance - Residual deviance
```

If total deviance is high, the predictors are helping. We want the difference from null to be big. If the drop is small, the model is not improving much over the intercept-only baseline.

## Dispersion

The dispersion parameter controls how much variability exists around the mean.

```text
Var(Y_i) = phi * V(mu_i)
```

If `phi` is too small, the model underestimates uncertainty. Confidence intervals can become too narrow, and p-values can look more confident than they should.

If `phi` is too large, the model overestimates uncertainty, which can make predictions and inference less useful.

For Poisson and binomial GLMs, dispersion is often fixed under the basic model. But in real data, overdispersion can happen (use negative binomial in that case). That is one reason residual deviance, Pearson residuals, and dispersion checks matter. 

## Coefficients and marginal effects

GLM coefficients usually live on the link scale.

For logistic regression:

```text
logit(p) = log(p / (1 - p)) = X beta
```

A one-unit increase in `x_j` changes the log odds by `beta_j`. On the odds scale:

```text
odds multiplier = exp(beta_j)
```

For example:

```text
logit(p) = 0.5 + 0.13 * study_hours + 0.97 * female
```

Increasing `study_hours` by 1 increases `logit(p)` by `0.13`. On the odds scale:

```text
exp(0.13) = 1.14
```

So the odds of passing increase by about 14%, holding the other variables fixed.

For a log-link GLM:

```text
log(mu) = X beta
```

A one-unit increase in `x_j` multiplies the expected response by:

```text
exp(beta_j)
```

For Tweedie regression with a log link:

```text
log(mu) = beta_0 + beta_1 x_1 + ...
mu = exp(beta_0 + beta_1 x_1 + ...)
```

A 1-unit increase in `x_1` multiplies the expected response `mu` by `exp(beta_1)`.

Marginal effects answer a slightly different question. They ask how the expected response changes on the original `Y` scale when `x_j` changes.

```text
marginal effect of x_j = d E[Y | X] / d x_j
```

For nonlinear links, this depends on the current values of the predictors. That is why marginal effects can be calculated for each observation and then averaged, or calculated at a representative point like the mean or median predictor values.

## Why coefficient estimates become approximately normal

When we fit a GLM by maximum likelihood, each observation contributes a log-likelihood term.

```text
log L(beta) = sum over i of log f(y_i | x_i, beta)
```

Even when individual observations are not normally distributed, the score function is a sum of many independent contributions. Under regularity conditions, the central limit theorem implies the score becomes approximately normal, which leads to the asymptotic normality of the MLE estimator.

That is the basis for standard errors, confidence intervals, and Wald-style tests.

It also explains why multicollinearity affects inference. Multicollinearity may not bias the estimator by itself, but it increases the variance of `beta_hat`, which widens the sampling distribution.

## Things to check when using a GLM

- Does the chosen distribution match the response?
- Does the link function make sense for the target and business use case?
- Is the relationship of predictors and the expected response linear on the link scale?
- Are observations independent enough for the inference I am doing?
- Do residuals show curves, funnels, or clusters?
- Is deviance meaningfully lower than the null deviance?
- Is there overdispersion or underdispersion?
- Are coefficients stable and interpretable?


If I see strong curvature, funnels, or obvious grouping in the residuals, the model may need a different transformation, link, distribution, or feature structure.

## My takeaway

The thing I like about GLMs is that they sit in a very practical middle ground.

They are more flexible than ordinary least squares because they let the target distribution and variance structure change. But they are still very interpretable and explainable. We can explain what it predicts, how it is fit, why coefficients mean what they mean, and how uncertainty is estimated.

For insurance and many business problems, that combination is hard to beat. Plus, I think that a simple model is much easier to implement in production :)
