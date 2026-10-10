# Machine Learning - Interview Questions

## Topic: Artificial Intelligence

### Common Interview Questions on Machine Learning

1.  **What is the difference between Supervised and Unsupervised Learning?**
    *   *Hint:* Labeled data vs. unlabeled data. Supervised learns mapping. Unsupervised finds hidden structure.

2.  **Explain the concepts of Overfitting and Underfitting. How can you mitigate them?**
    *   *Hint:* Overfitting: high variance, learns noise. Mitigate: regularization, more data, pruning, early stopping. Underfitting: high bias, too simple. Mitigate: more complex model, better features.

3.  **What is the "Bias-Variance Tradeoff"?**
    *   *Hint:* Bias: error from simple assumptions. Variance: error from high sensitivity to small fluctuations in training data. Goal is to balance both for optimal performance.

4.  **Describe the role of Cross-Validation in model evaluation.**
    *   *Hint:* Splitting data into folds to train/test multiple times. Provides a more robust estimate of performance and reduces dependency on a specific train/test split.

5.  **What is Regularization (L1/L2)? Why is it used?**
    *   *Hint:* Adds penalty for large coefficients. Prevents overfitting by constraining model complexity. L1 (Lasso) can zero out coefficients; L2 (Ridge) penalizes squared magnitude.

6.  **Explain the evaluation metrics: Precision, Recall, and F1-Score.**
    *   *Hint:* Precision (accuracy of positive predictions). Recall (proportion of actual positives found). F1 (harmonic mean).

7.  **What is Gradient Descent?**
    *   *Hint:* Iterative optimization algorithm to find the minimum of a function (typically the loss function) by taking steps proportional to the negative gradient.

8.  **Differentiate between Bagging and Boosting.**
    *   *Hint:* Bagging (parallel, reduces variance). Boosting (sequential, reduces bias).

9.  **What is Feature Engineering, and why is it often more important than model selection?**
    *   *Hint:* Process of selecting/transforming variables. "Garbage in, garbage out"—a good model with bad features will perform poorly.

### Whiteboarding Exercise

**Problem:** Design a machine learning pipeline to predict whether an email is spam. You have a dataset of emails, each labeled as 'spam' or 'ham'.

**Discussion Points:**
*   **Preprocessing:** How would you convert raw text into numerical features? (Hint: Tokenization, TF-IDF, Word Embeddings).
*   **Model Selection:** Which models are suitable for classification? (Hint: Logistic Regression, Naive Bayes, SVM, Random Forest).
*   **Evaluation:** What metrics would you use to evaluate your spam classifier? (Hint: Recall is usually critical—you don't want to miss spam, but you also want high precision—don't mark ham as spam).
*   **Challenges:** How would you handle an imbalanced dataset (e.g., 90% ham)?

---
*Note: This is a manually-generated study resource for CS Engineering students.*