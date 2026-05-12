---
title: "Model Interpretability: SHAP, LIME, PDP, and ICE Plots"
description: "How I think about local explanations, global explanations, marginal effects, and individual-level model behavior."
date: "2026-05-09"
category: "Data Science"
tags: ["Interpretability", "SHAP", "LIME"]
---

Interpretability tools started making more sense to me when I stopped asking which one was "best."

They are not all trying to answer the same question.

Some tools explain one prediction. Some summarize the whole model. Some show average behavior. Some show how individual observations behave differently. If I mix those up, I can end up with a plot that looks useful but answers the wrong question.

The way I organize them right now is:

- SHAP: local and global feature contribution.
- LIME: local approximation around one prediction.
- PDP: average model behavior as one feature changes.
- ICE: individual-level behavior as one feature changes.

## SHAP: assigning credit to features

SHAP values explain how much each feature contributes to a prediction relative to a baseline.

The idea comes from Shapley values. For a feature, we look at many possible subsets of the other features and ask: how much does the prediction change when this feature is added?

In notation, the Shapley value for feature `i` is often written as:

```text
phi_i =
sum over S not containing i [
  |S|! (|F| - |S| - 1)! / |F|!
  * (f(S union {i}) - f(S))
]
```

The important part is not memorizing the formula. The important part is the logic: a feature gets credit based on its average marginal contribution across possible feature combinations.

That matters because feature contribution can depend on what other features are already known.

## A small SHAP example

Suppose a churn model predicts `0.78` for one customer, and the baseline prediction is `0.35`.

SHAP tries to explain the movement from `0.35` to `0.78`.

For example:

```text
baseline prediction: 0.35
monthly charge:      +0.22
short tenure:        +0.16
age:                 +0.05
support tickets:     +0.00
final prediction:     0.78
```

This is a local explanation. It explains one prediction, not the entire model.

## SHAP plots I would use

The plot depends on the question.

A waterfall plot is local. It shows the step-by-step movement from the base value to one prediction. This is useful when I want to explain a single case.

A bar plot is global. It ranks features by mean absolute SHAP value. The absolute value matters because positive and negative effects can cancel out if I simply average signed SHAP values.

A beeswarm plot is also global, but more informative than a plain bar plot. It shows importance, direction, and spread. The y-axis ranks features. The x-axis shows SHAP values. Each dot is one row. Color usually represents the raw feature value.

A dependence plot shows how one feature's raw value relates to its SHAP value. If the points form a nonlinear curve, the model learned a nonlinear effect. If the vertical spread is wide, another feature may be interacting with it.

Force plots are local "tug-of-war" visuals: some features push the prediction higher, others push it lower.

Stacked force plots take many local explanations and arrange them together, which can reveal groups of similar explanations.

For SHAP specifically, I found the Neptune SHAP values article useful as a reference for the different plot types: [https://neptune.ai/blog/shap-values](https://neptune.ai/blog/shap-values).

## LIME: explaining one prediction locally

LIME is also local, but the mechanism is different.

The idea is to explain a complicated model by approximating it with a simpler model near the point I care about.

The algorithm is:

1. Pick the input I want to explain.
2. Create perturbed samples around that input.
3. Run those perturbed samples through the original black-box model.
4. Weight samples by how close they are to the original input.
5. Fit a simple weighted model, often linear.
6. Interpret the simple model's coefficients as the local explanation.

The word "local" is doing a lot of work here. LIME is not saying the black-box model is globally linear. It is saying that near this one point, a simple approximation may be useful.

## A LIME example

Suppose the original input is:

```text
Age = 45
Charge = 90
Tenure = 12
```

The black-box model predicts:

```text
churn probability = 0.78
```

LIME creates nearby samples:

```text
(Age=44, Charge=92, Tenure=11) -> churn = 0.80
(Age=50, Charge=85, Tenure=14) -> churn = 0.62
(Age=46, Charge=70, Tenure=12) -> churn = 0.35
```

Samples closer to `(45, 90, 12)` receive higher weights. Samples farther away receive lower weights.

Then LIME fits a simple local regression:

```text
p = 0.20 + 0.01 * Age + 0.015 * Charge - 0.03 * Tenure
```

In this local neighborhood:

- higher charge increases predicted churn
- longer tenure decreases predicted churn
- age slightly increases predicted churn

That explanation is local. It may not hold for every customer.

## When I would use LIME

I would use LIME when I need an explanation for one prediction and I want something model-agnostic.

The caution is that the explanation depends on how the neighborhood is generated. If the perturbations are unrealistic, the explanation can look precise while describing a neighborhood that does not make sense.

So LIME is useful, but I would not treat it as truth. I would treat it as a local approximation.

## PDP: average model behavior

Partial Dependence Plots answer a different question:

How does the model's prediction change on average as one feature changes?

This is not the same as plotting raw `X` against raw `Y`. A raw scatterplot shows the data relationship. A PDP shows the model's learned prediction behavior after averaging over the other features.

The basic process is:

1. Train the model normally.
2. Select the feature I want to inspect.
3. Create a grid of values for that feature.
4. For each grid value, replace that feature with the fixed value for every sampled row.
5. Generate predictions for the modified dataset.
6. Average the predictions.
7. Plot the average prediction against the grid values.

For one feature, I am fixing that feature and averaging over the observed distribution of the other features.

For two features, I fix both features over a grid of value combinations, predict, average, and plot a surface or heatmap.

## A PDP example

Suppose I want to understand how `monthly_charge` affects predicted churn.

I might create a grid:

```text
monthly_charge = [40, 60, 80, 100, 120]
```

For `monthly_charge = 40`, I replace every customer's monthly charge with 40, keep their other features as they are, predict churn for all rows, and average the predictions.

Then I repeat for 60, 80, 100, and 120.

The result might look like:

```text
charge  average predicted churn
40      0.18
60      0.24
80      0.36
100     0.55
120     0.66
```

That would suggest the model's average prediction increases as monthly charge increases.

## How I interpret PDPs

An upward trend suggests the model predicts higher outcomes as the feature increases.

A flat line suggests the model is not using that feature much, at least on average.

A curved line suggests nonlinear behavior.

The phrase "on average" is the warning label. PDP can hide subgroup differences. It can also create unrealistic feature combinations when the feature of interest is strongly correlated with other features.

For example, if temperature and ice cream sales are strongly related, forcing temperature to change while holding ice cream sales fixed may create samples that do not represent reality.

## ICE: individual behavior behind the average

ICE plots are closely related to PDPs.

The difference is that ICE keeps the individual lines instead of averaging them immediately.

For each observation, I vary the feature of interest across the grid and plot that observation's prediction path. The PDP is basically the average of those ICE lines.

This makes ICE useful when the average hides variation.

## An ICE example

Using the same monthly charge example, imagine three customers:

```text
Customer A: long tenure, low support tickets
Customer B: medium tenure, some support tickets
Customer C: short tenure, many support tickets
```

If all three ICE lines rise similarly as charge increases, then the PDP average is probably a good summary.

If Customer C's line rises sharply while Customer A's line is flat, then the average PDP is hiding subgroup behavior.

If ICE lines cross heavily, that can suggest interactions. The effect of monthly charge may depend on another feature like tenure or support history.

Coloring ICE lines by a second feature can help reveal this. For example, coloring by tenure might show that short-tenure customers respond differently than long-tenure customers.

## How I choose among them

If I need to explain one prediction, I would start with SHAP waterfall or LIME.

If I need global importance, I would use SHAP bar or beeswarm plots.

If I need to understand how one feature changes model predictions on average, I would use PDP.

If I suspect interactions or subgroup differences, I would use ICE alongside PDP.

The main thing I want to remember is that interpretability tools are diagnostic tools. They help me ask better questions about a model, but they do not automatically prove causality, fairness, or correctness.
