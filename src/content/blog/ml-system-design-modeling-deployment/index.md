---
title: "ML System Design, Part 2: Features, Model Selection, and Evaluation"
description: "Notes on feature engineering, leakage, model selection, experiment tracking, evaluation, and distributed training."
date: "2024-04-02"
category: "ML Systems"
tags: ["ML System Design", "Features", "Evaluation"]
---

Once the problem and data are framed, the next challenge is building a model that can actually survive contact with messy data and real evaluation.

This is where feature engineering, model selection, and evaluation start to blur together. A feature that looks useful may leak information. A model that performs well overall may fail on an important slice. A metric that looks good in aggregate may hide the exact behavior I care about.

That is the part I keep trying to remember: model development and system design are not separate phases. Every modeling choice is also a production choice.

## Feature engineering is still central

Having the right features is still one of the most important parts of building ML models.

Some features can be learned automatically, especially with deep learning systems, but I do not think we are at the point where feature work disappears. In many practical systems, the quality of the features still determines whether the model has a real chance.

The production question is not only "does this feature improve validation performance?" It is also:

- Can I compute this feature at inference time?
- Does it leak label information?
- Will it still exist when the product or data source changes?
- Does it behave similarly across train, validation, and production data?


## Missing values are information

Missing values are a good example of how preprocessing decisions can affect both model quality and bias.

There are three missingness patterns I should emphasize:

**Missing not at random (MNAR)** means the value is missing because of the true value itself. Income is a classic example. Higher income respondents may be less likely to disclose income, so the fact that income is missing already tells me something.

**Missing at random (MAR)** means the value is missing because of another observed variable. For example, age may be missing more often for one gender group, not because of the age value itself, but because that group is less likely to disclose age.

**Missing completely at random (MCAR)** means there is no pattern in the missingness. Someone simply forgot to fill in a field. This is the cleanest case, but it is also rare enough that I should be careful before assuming it.

That distinction changes what I should do. Dropping rows may be fine when missingness is tiny and truly random. But if missing income means something about the person or the process, deleting those rows can remove useful signal and introduce bias.

Sometimes the missingness indicator is itself a feature:

```text
income_missing = 1 if income is missing else 0
```

That can be especially useful for MNAR cases, where "missing" is not just an absence of data. It is part of the data-generating process.

## Deletion and imputation are not neutral

Column deletion can make sense when a feature has too much missingness to be useful. Row deletion can work when the number of missing examples is tiny and the missingness is **MCAR**.

But row deletion can go wrong quickly.

If missing income is MNAR, removing those rows may remove high-income users from the training set. If missing age is MAR and concentrated in one group, removing rows with missing age may make the model worse for that group.

Imputation has its own risks. Filling missing values with `0` can be dangerous if `0` is a possible real value. The model may not be able to distinguish "unknown" from "actually zero."

And imputation can leak information if I calculate imputation statistics using validation or test data.

```text
Wrong:
fit imputer on train + validation + test

Right:
fit imputer on training data only
apply the learned imputer to validation, test, and production data
```

That same rule applies to scaling and many other preprocessing steps. The preprocessing object is part of the model pipeline.

## Scaling, skew, and binning

Feature scaling makes numerical features comparable in range. This matters especially for models that are sensitive to feature scale, such as logistic regression, neural networks, distance-based methods, and many regularized models.

Common choices are min-max scaling and standardization:

```text
min-max scaling:
x_scaled = (x - min(x)) / (max(x) - min(x))

standardization:
z = (x - mean(x)) / std(x)
```

The catch is that these transformations use global statistics. If the production distribution drifts away from the training distribution, the scaling may become stale. That is one reason preprocessing has to be monitored and periodically retrained.

Skewed features are another common issue. A log transform can help when a feature has a long right tail:

```text
x_transformed = log(1 + x)
```

It does not always work, but it is often worth checking.

Binning, or discretization, turns a continuous feature into categories. I especially like this in GLM-style pricing work because it can make the model more interpretable. For example, binned continuous variables can become rating levels.

The tradeoff is that binning loses some information. The benefit is interpretability and operational simplicity.

## Categorical features are dynamic

In a static data science setting, categories can feel fixed. In production, categories change.

A new brand appears. A new territory code arrives. A new product type gets created.

One approach is to create an `UNKNOWN` category, so inference does not crash when an unseen category appears. But this has a subtle issue: if the model never saw `UNKNOWN` during training, the category exists technically, but the model has not **learned** much from it.

Another approach is the hashing trick. Instead of keeping a fixed vocabulary of categories, we map each category into a fixed-size hash space.

```text
category -> hash(category) -> bucket index
```

If the hash space has size `N`, the encoded feature always has a fixed dimension:

```text
[0, 0, 1, 0, ..., 0]  length N
```

Hashing helps with unseen categories because every new category can still be mapped into a bucket. The tradeoff is *collision*: two different categories may land in the same bucket.

**Locality-sensitive hashing** can be useful when the goal is to hash similar categories near each other, using ideas such as Jaccard similarity. But the broader lesson is: categorical encoding is not just a training-time choice. It is an inference-time reliability choice.

## Be aware of leakage

A lot of feature engineering mistakes are leakage mistakes.

The rules I want to keep close are simple:

- Split data before scaling or imputation.
- Calculate preprocessing statistics only on training data.
- Check duplicates before and after splitting.
- Oversample (if needed) only after splitting.
- Investigate features that look too good to be true.
- Be careful when new features are added to the model.

Leakage is dangerous because it can make a model look excellent in validation while failing in production.

## Model selection should start simple

The state-of-the-art model is not automatically the best production model.

A simpler model is easier to deploy, easier to debug, and easier to use as a baseline. It also helps validate that the training pipeline and prediction pipeline are consistent.

I like this framing: complexity has to earn its place. If a simple model does a reasonable job, a complex model should be meaningfully better to justify the extra cost.

There are six model-selection reminders from my notes that I want to keep explicit.

**1. Avoid the state-of-the-art trap.**

t doesn’t mean that this model will be fast enough or cheap enough for you to implement. It doesn’t even mean that this model will perform better than other models on your data.

**2. Start with the simplest model.**

Simpler models are easier to deploy, and deploying early allows you to validate that your prediction pipeline is consistent with your training pipeline. Also, starting simple and adding more complex components step by step makes it easier to understand your model and debug it. Lastly, simple model serves as a baseline.

**3. Evaluate good performance now versus good performance later.**

A model that performs best today may not be the model that improves best as more data arrives.

Learning curves help with this question. If I plot performance as the training set grows, I can see whether the model is still improving, flattening out, or overfitting.


**4. Evaluate trade-offs.**

The best model depends on the cost of different mistakes.

False positives and false negatives are not equally bad in every system. For cancer screening, I would usually care a lot about reducing false negatives, because missing a true case can be very costly. For spam filtering, false positives may be more damaging because it may put a normal email to a spam folder.

So the selection question is not just "which model has the highest score?" It is:

```text
Which error am I willing to make more often?
Which error is more expensive?
```

**5. Understand the model's assumptions.**

Every model carries assumptions. Some assume linear relationships. Some assume conditional independence. Some assume the data is i.i.d. Some assume a particular distributional shape, such as normality.

The assumptions do not have to be perfectly true for the model to be useful. But I should know what they are, because when the model fails, it often fails exactly where those assumptions were weakest.

For me, the model selection section boils down to this: pick the model that fits the system, not just the leaderboard.

## Ensembles are a tradeoff

Ensembles can improve performance, especially when a small lift has large financial value. Click-through-rate prediction is a good example where small gains can matter a lot.

But ensembles are less convenient in production. They can be harder to deploy, slower to serve, and harder to maintain.

Stacking adds another layer: train base learners, then train a meta-learner to combine their outputs.

```text
base models -> predictions -> meta-learner -> final prediction
```

That can be powerful, but it adds another system to debug. For production, I would want the performance gain to be worth the operational complexity.

## Evaluation needs more than one aggregate metric

Offline evaluation is necessary, but a single aggregate metric is not enough.

Perturbation tests add noise to the input data and check whether the model is robust to changes that may happen in the real distribution.

Invariance tests keep the important input information the same but change sensitive or private attributes. If the prediction changes when it should not, that is a warning sign.

Directional expectation tests check whether predictions move in the expected direction. If adding risk factors lowers predicted risk, I need to investigate. This is one of main evaluation when using GLM, to see if the direction of the coefficient makes sense. 

Calibration measurement checks each individual sample. System level measurement is useful to get a sense of overall performance, but sample level metrics are crucial when you care about your system’s performance on every sample.

Slice-based evaluation separates data into subsets and look at the model’s performance on each subset separately. Simpson’s paradox is a reason why you need a slice-based evaluation. Aggregation can conceal and contradict actual situations. 

## Experiment tracking is part of modeling

An experiment is more than a metric.

I would want to track:

- parameters and hyperparameters
- training and validation loss curves
- performance metrics
- sample predictions and ground truth labels
- artifacts such as plots
- speed and latency
- memory, CPU, and GPU usage
- data versions
- code versions

This matters because ML debugging is slow. Models can fail silently, and validating changes can take a long time. If a model fails later, the experiment record is often the only way to reconstruct what happened.

Data versioning is especially hard compared with code versioning. Code is usually small and text-based. Data is large, mutable, and often produced by pipelines that change over time.

## My takeaway

The second post of the series is the longest, and I think that demonstrates the complexity of model building process. Model development is not just choosing an algorithm, but involves thinking about which features are usable, which preprocessing decisions are safe, which model is practical, and which metrics matter. The real goal is not just to train a model. It is to build a model that still makes sense when the rest of the system shows up.
