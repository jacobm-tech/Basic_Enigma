import random
from collections import Counter


def same_letters(a,b):
    return sum(a[i] == b[i] for i in range(len(a)))


def diff_letters(a,b):
    return sum(a[i] != b[i] for i in range(len(a)))


def ioc(answer):
    letterCounts = Counter(answer)
    ioc = sum(ni * (ni - 1) for ni in letterCounts.values())
    ioc = ioc/(len(answer)*(len(answer)-1))
    ioc = ioc*26
    return ioc


def random_stecker():
    a = alphabet.copy()
    random.shuffle(a)
    unsteckered = a[-6:]
    steck = list(zip(a[0:19:2], a[1:20:2]))
    return steck, unsteckered

    return 0


def stecker(a):
    unsteckered = a[-6:]
    steck = list(zip(a[0:19:2], a[1:20:2]))
    return steck, unsteckered


def alpha(st, unst):
    a = [c for pair in st for c in pair]
    a.append(unst)
    return a


alphabet = list("abcdefghijklmnopqrstuvwxyz")
