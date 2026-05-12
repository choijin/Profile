---
title: "Controls, Offsets, and Omitted Variable Bias in GLMs"
description: "When to estimate a variable as a control, when to use an offset, and why omitted variables can bias insurance models."
date: "2026-05-11"
category: "Data Science"
tags: ["GLM", "Controls", "Offsets"]
---

Controls and offsets both adjust a model for factors outside the main variables of interest, but they do it in different ways.

The distinction matters in insurance modeling because some variables, such as territory or symbol, may be important but awkward to estimate jointly with every other rating variable.

## Omitted variable bias

Suppose we are modeling claim frequency using driver age, vehicle use, multiple-car status, vehicle symbol, and territory.

If territory is dropped from the model, driver age may partly act as a proxy for territory. For example, if a territory has a large share of young drivers and also has high claim frequency, the model may incorrectly attribute part of the territory effect to driver age.

That is omitted variable bias. The estimated coefficient for driver age no longer reflects only driver age; it also absorbs omitted structure.

## Control variables

A control variable is included in the model and estimated jointly with the variables of interest.

If territory is included as a control, the model estimates the effect of territory while also estimating the effect of driver age. This helps isolate the net effect of driver age after accounting for territory.

The tradeoff is that controls can compete with other predictors for shared signal. Large categorical controls may also introduce multicollinearity or inflate standard errors.

## Offsets

An offset is used when the effect is treated as known rather than estimated.

If territory and symbol factors were estimated separately, we can adjust exposure by those factors before fitting the model:

<div class="math-block">
adjusted exposure = exposure * territory factor * symbol factor
</div>

Alternatively, we can leave the target unadjusted and include the known adjustment as an offset:

<div class="math-block">
log(E[Y]) = X beta + log(territory factor * symbol factor)
</div>

The offset coefficient is fixed at 1. The model does not estimate it.

## Control vs. offset

A control is conditional residualization. The model estimates the control and the main predictors jointly, so they can compete for shared variation.

An offset is structural residualization. The known effect is removed or accounted for before the remaining predictors are estimated.

That makes offsets useful when a factor is already known or deliberately fixed. Controls are better when the effect needs to be estimated from the data.

## Practical takeaway

If the factor is unknown and should be learned, use a control.

If the factor is known, approved, or intentionally fixed from another analysis, an offset can be cleaner.

The choice is not just technical. It changes coefficient interpretation, stability, and how much the model is allowed to revise existing business structure.
