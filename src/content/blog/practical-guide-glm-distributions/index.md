---
title: "A Practical Guide to GLM Distributions"
description: "How binomial, Poisson, negative binomial, gamma, inverse Gaussian, chi-square, and Tweedie distributions show up in modeling."
date: "2026-05-09"
category: "Data Science"
tags: ["GLM", "Distributions", "Statistics"]
---

Choosing a GLM distribution is really choosing what kind of response variable you believe you are modeling.

The distribution defines the support of the response, the shape of the conditional response, and the mean-variance relationship the model expects.

In GLM notation, the model focuses on the conditional mean:

<div class="math-block">
mu_i = E[Y_i | X_i]
</div>

and connects that mean to predictors through a link function:

<div class="math-block">
g(mu_i) = X_i beta
</div>

The distribution then controls how the variance behaves around that mean.

## Binomial

The binomial distribution models the number of successes in a fixed number of independent trials, where each trial has two possible outcomes and the probability of success is constant.

<div class="math-block">
Y ~ Binomial(n, p)
</div>

The mean and variance are:

<div class="math-block">
E[Y] = np
Var(Y) = np(1 - p)
</div>

When `n = 1`, the binomial becomes the Bernoulli distribution. A binomial GLM with a logit link is logistic regression.

The linear predictor can take any real value, so we need a link function that maps probabilities from `(0, 1)` to `(-infinity, infinity)`. The logit link does that by modeling log-odds:

<div class="math-block">
log(p / (1 - p)) = X beta
</div>

At any value of `X`, the model predicts a binomial distribution with a certain probability of success.

## Poisson

The Poisson distribution is used for count data: the number of events occurring in a fixed interval of time, space, or exposure.

<div class="math-block">
Y ~ Poisson(lambda)
E[Y] = lambda
Var(Y) = lambda
</div>

In insurance, the random variable might be claim count. The model predicts a continuous conditional mean even though the observed response is discrete.

For claim frequency, the common GLM setup is to use claim count as the target and include exposure as an offset:

<div class="math-block">
log(E[claim count]) = X beta + log(exposure)
</div>

The strict Poisson assumption is that variance increases linearly with the mean. In real claim frequency data, variance is often greater than the mean. That is overdispersion.

Overdispersion can come from unobserved heterogeneity. For example, if risky and safe policyholders are pooled together but modeled with one Poisson rate, the observed variance will be too large for a simple Poisson model.

If overdispersion is ignored, standard errors and p-values can be distorted.

## Negative binomial

The negative binomial distribution is often used for count data when variance exceeds the mean.

One way to understand it is as a Poisson model where the rate itself varies across observations:

<div class="math-block">
Y | theta ~ Poisson(theta)
theta ~ Gamma(...)
</div>

The result is a count distribution with extra variance:

<div class="math-block">
Var(Y) = mu + alpha * mu^2
</div>

In insurance frequency modeling, the target should be claim count, not frequency. Use claim count as the response and `log(exposure)` as an offset.

That matters because the negative binomial variance structure does not scale cleanly when counts are divided by exposure into rates. The count-plus-offset setup preserves the intended distributional assumptions.

## Gamma

The gamma distribution is useful for positive continuous outcomes that are skewed to the right.

It has a lower bound at zero, a sharp peak, and a long right tail. These are common characteristics of claim severity, which is why gamma is widely used for severity modeling.

In GLM form, the gamma distribution is often parameterized by its mean and dispersion rather than directly by shape and scale:

<div class="math-block">
E[Y] = mu
Var(Y) = phi * mu^2
</div>

This variance function is useful because higher expected severity is allowed to have higher variance. A log link is common because it keeps predictions positive and makes effects multiplicative.

## Inverse Gaussian

The inverse Gaussian distribution is also positive and right-skewed, but it has a sharper peak and wider tail than gamma.

It can be appropriate when severity is expected to be more extremely skewed.

Its GLM variance relationship grows faster than gamma:

<div class="math-block">
Var(Y) = phi * mu^3
</div>

A practical diagnostic is to group the data, calculate empirical mean and variance within each group, and examine how variance grows with the mean.

If variance grows roughly quadratically, gamma may fit better. If variance grows more explosively, inverse Gaussian may be worth considering.

## Chi-square

The chi-square distribution is not usually chosen as a response distribution for everyday GLMs. It shows up in inference.

A chi-square random variable with `k` degrees of freedom is a sum of squared independent standard normals:

<div class="math-block">
chi^2_k = Z_1^2 + Z_2^2 + ... + Z_k^2
</div>

In classical linear models, chi-square results arise from quadratic forms of normal vectors. In GLMs, chi-square shows up asymptotically through likelihood theory.

For nested GLMs, Wilks' theorem justifies comparing deviance differences:

<div class="math-block">
Delta D = 2(log L_full - log L_reduced) ~ chi^2_q
</div>

where `q` is the number of additional parameters.

This is the theoretical basis for likelihood ratio tests and drop-in-deviance tests.

## Tweedie

The Tweedie family is useful when the response is nonnegative, has many zeros, and has positive continuous values when nonzero.

This makes it attractive in insurance. Many policies have zero loss, but when a claim occurs, the amount is positive and right-skewed.

For power parameters between 1 and 2, Tweedie can be viewed as a compound Poisson-gamma process:

<div class="math-block">
N ~ Poisson(lambda)
X_i ~ Gamma(...)
Y = X_1 + X_2 + ... + X_N
</div>

If `N = 0`, total loss is zero. If `N > 0`, total loss is a sum of gamma severities.

The mean-variance relationship is:

<div class="math-block">
Var(Y) = phi * mu^p
</div>

Different values of `p` connect Tweedie to familiar distributions:

- `p = 0`: normal
- `p = 1`: Poisson
- `p = 2`: gamma
- `p = 3`: inverse Gaussian

For pure premium or loss ratio, the common insurance range is between 1 and 2.

## Tweedie vs. frequency-severity

Tweedie models the combined loss directly. Frequency-severity modeling splits the problem into how often claims happen and how large they are.

The split can provide better insight. A variable might reduce frequency but increase severity. A pure premium model can hide that because the effects may cancel out.

Separate frequency and severity models can also reduce noise because each model is focused on a more specific target.

The Tweedie assumption is that predictors tend to move frequency and severity in the same direction. That can be useful, but it is not always true.

## The modeling question

The practical question is not "which distribution is best?" in the abstract. It is:

- Is the target binary, count, positive continuous, or zero-inflated continuous?
- How does variance change as the mean changes?
- Does the model need probabilities, counts, severities, or pure premium?
- Does exposure need to be handled as an offset?
- Are the assumptions useful enough for the business problem?

That framing keeps distribution choice tied to the data-generating process instead of treating it like a menu of technical options.
