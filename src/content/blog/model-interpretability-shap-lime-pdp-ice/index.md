---
title: "Model Interpretability: SHAP, LIME, PDP, and ICE Plots"
description: "How I think about local explanations, global explanations, marginal effects, and individual-level model behavior."
date: "2024-11-20"
order: 7
category: "Data Science"
tags: ["Interpretability", "SHAP", "LIME"]
---

I am realizing more and more that knowing how to evaluate a model is just as important as building a model. Here are some of evaluation techniques that came across during my experience as a data scientist.

- SHAP: local and global feature contribution.
- LIME: local approximation around one prediction.
- PDP: average model behavior as one feature changes.
- ICE: individual-level behavior as one feature changes.

## SHAP: assigning credit to features

SHAP values explain how much each feature contributes to a prediction relative to a baseline.

The idea comes from Shapley values. For a feature, we look at many possible subsets of the other features and ask: how much does the prediction change when this feature is added?

The logic is: a feature gets credit based on its average marginal contribution across possible feature combinations.

That matters because feature contribution can depend on what other features are already known.

## How SHAP is calculated

For one prediction, SHAP asks: if I add this feature to different possible groups of features, how much does the prediction change on average?

Suppose the model has three features:

```text
F = {F1, F2, F3}
```

If `F1` is the feature of interest, we look at subsets of the other features:

```text
{}          baseline / no features
{F2}
{F3}
{F2, F3}
```

The empty set is the baseline case. In practice, this is often represented as the average model prediction when no feature information is known.

```text
F0 = baseline prediction
```

Then we calculate the marginal contribution of `F1` in each situation. The trained model stays the same. We are not retraining the model. We are asking how the prediction changes when `F1` is included versus excluded from a subset.

For `F1`, the marginal contributions look like:

```text
f({F1})           - f({})
f({F1, F2})       - f({F2})
f({F1, F3})       - f({F3})
f({F1, F2, F3})   - f({F2, F3})
```

The important detail is that these marginal contributions are not all weighted equally. A feature might look very powerful when only a few features are known, but less important once many other features are already included. SHAP handles this by applying Shapley weights.

The weight is what makes the attribution fair across different subset sizes and feature orderings. It accounts for how many possible permutations include the feature before or after a given subset.

Then the same process is repeated for every feature in the row.

The local explanation adds back up to the prediction:

```text
model prediction = baseline + sum of SHAP values
```

For a global explanation, we usually calculate SHAP values across many rows and **aggregate** them. A common global importance measure is the mean absolute SHAP value.


## SHAP plots I would use

The plot depends on the question.

- **Waterfall plot:** local explanation for one prediction. It shows how the baseline prediction moves up or down until it reaches the final prediction.

- **Bar plot:** global feature importance. It ranks features by average absolute SHAP value, so positive and negative effects do not cancel each other out.

- **Beeswarm plot:** global explanation with more detail than a bar plot. It shows feature importance, direction, and spread across many rows.

- **Dependence plot:** shows how one feature's actual value relates to its SHAP value. Curves suggest nonlinear effects. Wide vertical spread can suggest interactions.

- **Force plot:** local explanation for one prediction. It shows which features push the prediction higher and which features push it lower.

- **Stacked force plot:** many force plots stacked together. This can reveal groups of rows with similar explanation patterns.

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

The word "local" is doing a lot of work here. LIME is not saying the black-box model is globally linear. It is saying that **near** this one point, a simple approximation may be useful.

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

I would use LIME when I need an explanation for one prediction and I want something model-agnostic.

The caution is that the explanation depends on how the neighborhood is generated. If the perturbations are unrealistic, the explanation can look precise while describing a neighborhood that does not make sense.

## PDP: average model behavior

Partial Dependence Plots answer a different question:

How does the model's prediction change on average as one feature changes?

This is not the same as plotting raw `X` against raw `Y`. A raw scatterplot shows the data relationship. A PDP shows the model's learned prediction behavior after averaging over the other features.

The basic process is:

1. Train the model normally.
2. Select the feature I want to inspect.
3. Create a grid of values for that feature.
4. For each grid value, replace that feature with the **fixed value** for every sampled row.
5. Generate predictions for the modified dataset.
6. Average the predictions.
7. Plot the average prediction (y) against the grid values (x).

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

## Interpretation and Limitation

- An upward trend suggests the model predicts higher outcomes as the feature increases.

- A flat line suggests the model is not using that feature much, at least on average.

- A curved line suggests nonlinear behavior.

The phrase "on average" is the warning label, and PDP can hide subgroup differences. It can also create **unrealistic** feature combinations when the feature of interest is strongly correlated with other features.

For example, if temperature and ice cream sales are strongly related, forcing temperature to change while holding ice cream sales fixed may create samples that do not represent reality.

## ICE: individual behavior behind the average

ICE plots are closely related to PDPs but solves some limitations of PDP.

The difference is that ICE keeps the individual lines instead of averaging them immediately.

For each observation, I vary the feature of interest across the grid and plot that observation's prediction path. The PDP is basically the average of those ICE lines.

This makes ICE useful when the average hides variation.

## How I choose among them

If I need to explain one prediction, I would start with SHAP waterfall or LIME.

If I need global importance, I would use SHAP bar or beeswarm plots.

If I need to understand how one feature changes model predictions on average, I would use PDP.

If I suspect interactions or subgroup differences, I would use ICE alongside PDP.

Knowing how to diagnose a model is a critical skill, and something I continue working on developing.
