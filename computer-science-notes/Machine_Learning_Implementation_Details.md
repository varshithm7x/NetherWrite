# Machine Learning - Implementation Details

## Topic: Artificial Intelligence

### 1. Linear Regression (Supervised Learning)
-   **Principle:** Fits a linear equation to observed data. Predicts a continuous target value `y` based on input `x`. `y = mx + b`.
-   **Optimization:** Uses Gradient Descent to minimize the mean squared error between predictions and actual values.

```python
import numpy as np

# Simple implementation using numpy
def linear_regression(X, y, learning_rate=0.01, iterations=1000):
    m = len(y)
    theta = np.zeros(X.shape[1])
    
    for _ in range(iterations):
        predictions = X.dot(theta)
        errors = predictions - y
        gradient = (1/m) * X.T.dot(errors)
        theta -= learning_rate * gradient
    return theta
```

### 2. K-Means Clustering (Unsupervised Learning)
-   **Principle:** Partitions `n` observations into `k` clusters in which each observation belongs to the cluster with the nearest mean (centroid).
-   **Steps:**
    1.  Initialize `k` centroids randomly.
    2.  Assign each data point to the nearest centroid.
    3.  Recalculate centroids as the mean of points in each cluster.
    4.  Repeat until convergence.

```python
def k_means(X, k, iterations=100):
    centroids = X[np.random.choice(X.shape[0], k, replace=False)]
    
    for _ in range(iterations):
        # Assign points to nearest centroid
        distances = np.sqrt(((X - centroids[:, np.newaxis])**2).sum(axis=2))
        labels = np.argmin(distances, axis=0)
        
        # Update centroids
        new_centroids = np.array([X[labels == i].mean(axis=0) for i in range(k)])
        if np.all(centroids == new_centroids):
            break
        centroids = new_centroids
    return labels, centroids
```

### 3. Model Evaluation (Scikit-Learn Example)
Modern ML often uses libraries like Scikit-Learn.

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# X: features, y: labels
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LogisticRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, predictions)}")
```

### 4. Handling Overfitting
-   **Regularization:** Adds a penalty term to the loss function to prevent coefficients from becoming too large (e.g., L1/Lasso, L2/Ridge).
-   **Cross-Validation:** Splitting data into multiple folds and training/testing multiple times to get a better estimate of model performance and reduce variance.
-   **Early Stopping:** Stopping the training process before the model starts to overfit, typically by monitoring validation set performance.

---
*Note: This is a manually-generated study resource for CS Engineering students.*