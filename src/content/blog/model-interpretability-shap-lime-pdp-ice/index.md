---
title: "Model Interpretability: SHAP, LIME, PDP, and ICE Plots"
description: "How I think about global and local explanation tools for machine learning models."
date: "2026-05-09"
category: "Data Science"
tags: ["Interpretability", "SHAP", "LIME"]
---

Interpretability tools answer different questions. The mistake is treating them as interchangeable.

Some tools explain a model globally. Others explain one prediction. Some show average effects. Others show individual-level behavior.

## SHAP values

SHAP values explain how much each feature contributes to a prediction relative to a baseline. The idea comes from Shapley values: each feature receives credit based on its marginal contribution across possible feature coalitions.

SHAP is useful because it can support both local and global explanations.

Common SHAP plots answer different questions:

- Waterfall plots explain one prediction step by step.
- Bar plots summarize global feature importance.
- Beeswarm plots show both feature importance and direction of effect.
- Dependence plots show how a feature's value relates to its SHAP contribution.
- Force plots show how features push one prediction higher or lower.

## LIME

LIME explains one prediction by creating perturbed samples near that observation, scoring those samples with the original model, weighting nearby samples more heavily, and fitting a simple local model.

The coefficients of the local model become the explanation.

The appeal is that LIME can explain complex black-box models with a simpler approximation. The tradeoff is that the explanation is local and depends on how the neighborhood is generated.

## Partial dependence plots

Partial dependence plots show the average predicted response as one feature changes, while averaging over the observed distribution of other features.

They are useful for understanding broad model behavior, but they can be misleading when features are strongly correlated. The plot may evaluate unrealistic combinations of feature values.

## ICE plots

Individual conditional expectation plots are like partial dependence plots at the observation level. Instead of showing only the average relationship, they show how predictions change for individual records.

This makes heterogeneity visible. If the average trend looks smooth but individual lines move differently, the model may be using interactions or subgroup-specific patterns.

## How I choose

For one prediction, I would reach for SHAP waterfall or LIME. For global feature importance, I would use SHAP bar or beeswarm plots. For feature-response behavior, I would compare PDP and ICE together.

No single interpretability plot proves that a model is fair, causal, or correct. These tools are best used as diagnostic lenses.
