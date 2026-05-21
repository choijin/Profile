---
title: "Understanding GLM Coefficients"
description: "How GLM coefficients are interpreted, and why correlated predictors can make that interpretation unstable."
date: "2026-05-12"
category: "Data Science"
tags: ["GLM", "Coefficients", "Multicollinearity"]
---

GLM is modeling the expected value of the response, conditional on the predictors. The coefficient does not describe what must happen to one individual observation, but it describes how the conditional **mean** moves inside the structure of the model.

```text
mu(x) = E[Y | X = x]
g(mu_i) = eta_i = X_i beta
```

Took me a while to understand, but a GLM coefficient lives on the link scale first, and only after applying the inverse link does it become a statement about the expected response on the original target scale.

## The coefficient is on the link scale

For a continuous variable, a coefficient is the change in the link-transformed expected response for a one-unit increase in that variable, holding the other variables fixed.

With a log link, the model is working with the log of the conditional mean:

```text
log(E[Y | X]) = beta_0 + beta_1 X_1 + ... + beta_p X_p
```

So if `beta_j = 0.10`, a one-unit increase in `X_j` adds `0.10` to the log expected response. On the original mean scale, that becomes multiplicative:

```text
E[Y | X_j + 1] / E[Y | X_j] = exp(beta_j)

exp(0.10) = 1.105
```

So the expected response is multiplied by about `1.105`, or increased by about `10.5%`, holding the other variables fixed.

This is why log links feel natural in pricing, frequency, severity, and pure premium work. The coefficient behaves more like a factor adjustment than a raw additive bump.

## Categorical coefficients are relative

Categorical coefficients have a small trap: they are always relative to a reference group.

If `A` is the reference category and `B` is included as a dummy variable, the coefficient for `B` is:

```text
beta_B = link(E[Y | category = B]) - link(E[Y | category = A])
```

With a log link, that becomes a ratio on the mean scale:

```text
E[Y | B] / E[Y | A] = exp(beta_B)
```

The reference level is absorbed into the intercept. This means that we get the baseline group by setting other predictors as 0, which is the same as the intercept. With several categorical variables, the intercept becomes a joint baseline. It means that all dummy coefficients are deviation relative to that combination, a joint baseline. 

It is important to distinguish the interpretation of coefficients for categorical variables and continuous variables. For continuous, it is a relationship between the predictor and the response. For categorical, it is a movement away from the baseline, not an absolute standalone effect. This will then mean that we need to be careful how we create this baseline.

## Correlated predictors make interpretation fragile

The interpretation gets harder when predictors are correlated.

At a high level, multicollinearity means two or more variables carry overlapping information. The model may still predict well, but it becomes harder to tell which variable deserves credit for the shared signal.

Suppose the true relationship is something like:

```text
Y = aX + bZ + error
```

If `X` and `Z` move together, the model has trouble separating the effect of `X` from the effect of `Z`. Several coefficient combinations can produce similar fitted values.

That is why multicollinearity is often more dangerous for explanation than for prediction. The fitted mean can stay stable while individual coefficients become sensitive to small changes in the data, sampling, or model specification.

## The matrix version of the problem

The technical version is matrix inversion.

In OLS, the coefficient estimate depends on inverting `X'X`:

```text
beta_hat = (X'X)^(-1) X'Y
```

In GLMs, the fitting process uses weighted versions of the same idea, often involving a matrix like:

```text
X' W X
```

If columns in the design matrix are perfectly linearly dependent, the matrix is singular. If they are almost linearly dependent, the inverse can become unstable.

That instability shows up in the coefficients. A small change in the data can cause a large change in an individual coefficient estimate, even when predictions barely move.

## Why standard errors inflate

The standard error formula makes the same point from another angle.

For a single coefficient in an OLS-style setting, the standard error is related to how much of that predictor can be explained by the other predictors:

```text
SE(beta_j) = sigma / sqrt(n * Var(X_j) * (1 - R_j^2))
```

Here, `R_j^2` comes from regressing `X_j` on the other predictors.

As `R_j^2` approaches 1, the term `(1 - R_j^2)` approaches 0. The denominator shrinks, and the standard error grows. That is the statistical version of the model saying: I cannot confidently isolate this variable from the others.

This is where inflated standard errors, wider confidence intervals, unstable p-values, and flipped signs can appear. A sign flip does not always mean the variable has the opposite business effect. Sometimes it means the model is overcompensating across correlated predictors.

## When I would worry less

I would not automatically drop a variable just because it is correlated with another variable.

There are cases where high correlation is less alarming:

- The model is mainly for prediction, not explanation.
- The high VIF belongs to a control variable, not the coefficient I plan to interpret.
- The collinearity comes from powers or interactions, like `x` and `x^2`.
- The issue is caused by dummy variables from a categorical feature with several levels.

In those cases, I would still inspect the model, but I would not treat multicollinearity as an automatic failure.

## What I would check

Pearson correlation is a starting point, but I think there should be more. 

The checks I would use are:

- VIF, especially for coefficients I plan to interpret.
- Standard errors and confidence intervals.
- Coefficient signs and whether they make sense.
- Stability under small data or specification changes.
- Condition number of the design matrix.

The condition number is another way of asking whether the matrix is close to singular:

```text
kappa(X) = sigma_max / sigma_min
```

where `sigma_max` and `sigma_min` are the largest and smallest singular values of `X`. A large condition number means the matrix is ill-conditioned. In practice, values above something like `30` are often treated as a warning sign.

## The practical takeaway

When predictors contain substantial overlap, the model may still produce reliable fitted values, but the interpretation of any single coefficient becomes more delicate. 

Before using a coefficient as a business explanation, it is important to assess whether the coefficient is truly stable and meaningful, or simply one possible allocation of shared predictive signal among correlated variables.
