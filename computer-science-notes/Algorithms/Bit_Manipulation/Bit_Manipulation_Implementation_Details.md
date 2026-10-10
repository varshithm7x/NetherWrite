# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Implementation Details

## Topic: Algorithms

### Basic Bitwise Operations in Python (and similar languages)

Assume `a = 5` (binary `0101`) and `b = 3` (binary `0011`).

#### 1. Bitwise AND (`&`)
```python
result = a & b
# a:   0101
# b:   0011
# res: 0001 (decimal 1)
print(f"a & b = {result}") # Output: 1
```

#### 2. Bitwise OR (`|`)
```python
result = a | b
# a:   0101
# b:   0011
# res: 0111 (decimal 7)
print(f"a | b = {result}") # Output: 7
```

#### 3. Bitwise XOR (`^`)
```python
result = a ^ b
# a:   0101
# b:   0011
# res: 0110 (decimal 6)
print(f"a ^ b = {result}") # Output: 6
```

#### 4. Bitwise NOT (`~`)
-   In Python, `~x` is equivalent to `(-x) - 1`. This is due to how negative numbers are represented (two's complement) and how the operation is defined.
```python
result = ~a
# a:   0000 0000 ... 0101
# ~a:  1111 1111 ... 1010 (two's complement of -6)
print(f"~a = {result}") # Output: -6
```

#### 5. Left Shift (`<<`)
```python
result = a << 1 # Shift a by 1 position to the left
# a:   0101
# res: 1010 (decimal 10)
print(f"a << 1 = {result}") # Output: 10

result = a << 2 # Shift a by 2 positions to the left
# a:   0101
# res: 010100 (decimal 20)
print(f"a << 2 = {result}") # Output: 20
```

#### 6. Right Shift (`>>`)
```python
result = a >> 1 # Shift a by 1 position to the right
# a:   0101
# res: 0010 (decimal 2)
print(f"a >> 1 = {result}") # Output: 2

neg_a = -5 # Binary (two's complement): ...11111011
result = neg_a >> 1
# res: ...11111101 (decimal -3)
print(f"neg_a >> 1 = {result}") # Output: -3 (arithmetic right shift)
```

### Common Bit Manipulation Tricks

#### 1. Checking if the Nth bit is Set
```python
def is_nth_bit_set(num, n):
    return (num & (1 << n)) != 0

num = 13 # 1101
print(f"Is 0th bit set in {num}? {is_nth_bit_set(num, 0)}") # True (1)
print(f"Is 1st bit set in {num}? {is_nth_bit_set(num, 1)}") # False (0)
print(f"Is 2nd bit set in {num}? {is_nth_bit_set(num, 2)}") # True (1)
print(f"Is 3rd bit set in {num}? {is_nth_bit_set(num, 3)}") # True (1)
```

#### 2. Setting the Nth bit
```python
def set_nth_bit(num, n):
    return num | (1 << n)

num = 4 # 0100
# Set 0th bit
new_num = set_nth_bit(num, 0) # 0100 | 0001 = 0101 (5)
print(f"Set 0th bit of {num}: {new_num}") # Output: 5
```

#### 3. Clearing the Nth bit
```python
def clear_nth_bit(num, n):
    return num & (~(1 << n))

num = 13 # 1101
# Clear 2nd bit
new_num = clear_nth_bit(num, 2) # 1101 & (~0100) = 1101 & 1011 = 1001 (9)
print(f"Clear 2nd bit of {num}: {new_num}") # Output: 9
```

#### 4. Toggling the Nth bit
```python
def toggle_nth_bit(num, n):
    return num ^ (1 << n)

num = 13 # 1101
# Toggle 1st bit (0 -> 1)
new_num = toggle_nth_bit(num, 1) # 1101 ^ 0010 = 1111 (15)
print(f"Toggle 1st bit of {num}: {new_num}") # Output: 15

# Toggle 0th bit (1 -> 0)
new_num = toggle_nth_bit(num, 0) # 1101 ^ 0001 = 1100 (12)
print(f"Toggle 0th bit of {num}: {new_num}") # Output: 12
```

#### 5. Checking if a number is a power of 2
```python
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

print(f"Is 8 a power of two? {is_power_of_two(8)}")  # True (1000 & 0111 = 0)
print(f"Is 7 a power of two? {is_power_of_two(7)}")  # False (0111 & 0110 != 0)
```

#### 6. Counting Set Bits (Hamming Weight)
```python
def count_set_bits(n):
    count = 0
    while n > 0:
        n &= (n - 1) # This clears the least significant set bit
        count += 1
    return count

num = 13 # 1101
print(f"Number of set bits in {num}: {count_set_bits(num)}") # Output: 3
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*