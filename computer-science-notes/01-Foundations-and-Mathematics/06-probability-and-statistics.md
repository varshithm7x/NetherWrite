# Probability and Statistics for Computing

## Core idea
Probability models uncertainty; statistics uses observed data to estimate properties and evaluate hypotheses. These tools support randomized algorithms, performance analysis, reliability, and machine learning.

## Essential concepts
- An event's probability lies between `0` and `1`; all outcomes in the sample space have total probability `1`.
- Conditional probability is `P(A|B) = P(A ∩ B)/P(B)` when `P(B) > 0`.
- Independence means `P(A ∩ B) = P(A)P(B)`.
- Bayes' rule is `P(A|B) = P(B|A)P(A)/P(B)`.
- Expected value is a probability-weighted average. Linearity of expectation holds even without independence.
- Variance measures squared deviation from the mean; standard deviation is its square root.

## Worked example: base rates
Suppose a fault affects `1%` of systems. A detector flags `90%` of faulty systems and falsely flags `5%` of healthy systems. For `10,000` systems, expected counts are:

```text
Faulty and flagged:   100 × 0.90 = 90
Healthy and flagged: 9900 × 0.05 = 495
P(fault | flag) = 90 / (90 + 495) ≈ 15.4%
```
A positive flag is therefore much less conclusive than the detector's sensitivity might suggest.

## Computing applications
Randomized quicksort analyzes expected partition behavior. Sampling estimates large populations without inspecting every item. Percentiles describe latency tails that an average can hide. Confidence intervals express uncertainty under a sampling model; they are not guarantees about one observed outcome.

## Common mistakes
Correlation does not establish causation. Independent events are different from mutually exclusive events. A biased sample can invalidate conclusions even when the arithmetic is correct. Statistical significance does not establish a large practical effect.

## Revision check
**Question:** Must variables be independent for expectations to add?
**Answer:** No: `E[X + Y] = E[X] + E[Y]` whenever the expectations exist.

## Connected concepts

- [[02-Algorithms/16-sorting-algorithms|Sorting Algorithms]] — Expected partition behavior explains randomized quicksort performance.

[Back to contents](../README.md)
# Probability and Statistics for Computing

## Core idea
Probability models uncertainty; statistics uses observed data to estimate properties and evaluate hypotheses. These tools support randomized algorithms, performance analysis, reliability, and machine learning.

## Essential concepts
- An event's probability lies between `0` and `1`; all outcomes in the sample space have total probability `1`.
- Conditional probability is `P(A|B) = P(A ∩ B)/P(B)` when `P(B) > 0`.
- Independence means `P(A ∩ B) = P(A)P(B)`.
- Bayes' rule is `P(A|B) = P(B|A)P(A)/P(B)`.
- Expected value is a probability-weighted average. Linearity of expectation holds even without independence.
- Variance measures squared deviation from the mean; standard deviation is its square root.

## Worked example: base rates
Suppose a fault affects `1%` of systems. A detector flags `90%` of faulty systems and falsely flags `5%` of healthy systems. For `10,000` systems, expected counts are:

```text
Faulty and flagged:   100 × 0.90 = 90
Healthy and flagged: 9900 × 0.05 = 495
P(fault | flag) = 90 / (90 + 495) ≈ 15.4%
```
A positive flag is therefore much less conclusive than the detector's sensitivity might suggest.

## Computing applications
Randomized quicksort analyzes expected partition behavior. Sampling estimates large populations without inspecting every item. Percentiles describe latency tails that an average can hide. Confidence intervals express uncertainty under a sampling model; they are not guarantees about one observed outcome.

## Common mistakes
Correlation does not establish causation. Independent events are different from mutually exclusive events. A biased sample can invalidate conclusions even when the arithmetic is correct. Statistical significance does not establish a large practical effect.

## Revision check
**Question:** Must variables be independent for expectations to add?
**Answer:** No: `E[X + Y] = E[X] + E[Y]` whenever the expectations exist.

## Connected concepts

- [[02-Algorithms/16-sorting-algorithms|Sorting Algorithms]] — Expected partition behavior explains randomized quicksort performance.

[Back to contents](../README.md)
