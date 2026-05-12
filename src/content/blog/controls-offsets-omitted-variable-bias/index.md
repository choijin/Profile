---
title: "Controls, Offsets, and Omitted Variable Bias in GLMs"
description: "When to estimate a variable as a control, when to use an offset, and why omitted variables can bias insurance models."
date: "2026-05-11"
category: "Data Science"
tags: ["GLM", "Controls", "Offsets"]
---

Controls and offsets are easy to group together because they both sound like ways of "adjusting" a model.

But they are not doing the same thing. The difference matters, especially in insurance models where some effects may already exist in a rating plan, while others are being estimated in the current model.

The way I think about it is this: a control is something the model is allowed to learn. An offset is something the model is told to accept.

## The omitted variable problem

Suppose I am modeling claim frequency, and the candidate predictors include driver age, vehicle use, multiple-car status, territory, and symbol.

Now imagine I drop territory from the model. If a particular territory has both higher claim frequency and a larger share of young drivers, driver age may start acting partly as a proxy for territory. The age coefficient is no longer just about age. It is absorbing some of the territory effect too.

In a simple linear setup, omitted variable bias is often written this way:

```text
True model:
Y = beta_0 + beta_1 X + beta_2 Z + error

Fitted model, after omitting Z:
Y = alpha_0 + alpha_1 X + error

Bias in alpha_1 depends on:
beta_2 * relationship between X and Z
```

So the omitted variable has to matter for `Y`, and it has to be related to `X`. If both are true, the coefficient on `X` gets contaminated.

This is the part that feels especially important in pricing work. If a coefficient is going to influence a rating decision, it needs to represent the effect we think it represents.

## What a control does

A control variable is included in the model and estimated alongside the variables we care about.

For a log-link GLM, that might look like:

```text
log(E[Y]) = beta_0 + beta_1 age + beta_2 territory + beta_3 symbol + ...
```

If I include territory as a control, the model estimates the age effect while accounting for territory. That helps isolate the age effect from the territory effect.

The tradeoff is that controls can fight with other variables for the same signal. Large categorical controls can be especially tricky because they may overlap with many other predictors. The model can become harder to interpret, standard errors can inflate, and the coefficient of interest may look weaker than expected.

That does not mean controls are bad. It just means they are not free.

## What an offset does

An offset is different because the model does not estimate its coefficient.

If territory and symbol factors were estimated somewhere else, I can treat those effects as known. For example, I might adjust exposure by multiplying it by known territory and symbol factors:

```text
u_adjusted = u * tau_i * sigma_j
```

where:

- `u` is the original exposure
- `tau_i` is the territory factor
- `sigma_j` is the symbol factor

In a log-link model, the same idea can be written as an offset:

```text
log(E[Y]) = X beta + log(tau_i * sigma_j)
```

If I am also modeling claim counts with exposure, the offset may include exposure too:

```text
log(E[claim_count]) = X beta + log(exposure) + log(tau_i * sigma_j)
```

The key is that the offset enters with a fixed coefficient of 1.

```text
coefficient on offset = 1
```

The model is not being asked, "What is the territory effect?" It is being told, "Use this adjustment, then estimate the remaining effects."

That can be cleaner when the adjustment is already known, approved, or intentionally fixed.

## Control vs. offset

I think of controls as conditional adjustment.

```text
Estimate:
log(E[Y]) = beta_0 + beta_1 X + beta_2 control
```

The model estimates the control and the main predictor together. If they share signal, they compete for it.

Offsets are structural adjustment.

```text
Estimate:
log(E[Y]) = beta_0 + beta_1 X + offset
```

The control effect has already been removed or built in before estimating the remaining coefficients.

That distinction is why offsets can be useful when a control variable would create severe multicollinearity. Since the offset coefficient is not estimated, it does not fight with the other predictors in the same way.

## How I would decide

If the effect needs to be learned from the current data, I would use a control.

If the effect is already known or should remain fixed, I would consider an offset.

The choice changes more than the formula. It changes what the model is allowed to learn, how coefficients should be interpreted, and whether the model can revise an existing business structure.
