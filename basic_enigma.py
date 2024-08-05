import re
import itertools
import time
from statistics import quantiles
import random
from utils import *
# from line_profiler_pycharm import profile



message = "THERE were two “Reigns of Terror,” if we would but remember it and consider it; the one wrought murder in hot passion, the other in heartless cold blood; the one lasted mere months, the other had lasted a thousand years; the one inflicted death upon ten thousand persons, the other upon a hundred millions; but our shudders are all for the “horrors” of the minor Terror, the momentary Terror, so to speak; whereas, what is the horror of swift death by the axe, compared with lifelong death from hunger, cold, insult, cruelty, and heart-break? What is swift death by lightning compared with death by slow fire at the stake? A city cemetery could contain the coffins filled by that brief Terror which we have all been so diligently taught to shiver at and mourn over; but all France could hardly contain the coffins filled by that older and real Terror—that unspeakably bitter and awful Terror which none of us has been taught to see in its vastness or pity as it deserves."
# message = "THERE were two “Reigns of Terror,” if we would but remember it and consider it"

st, unst = random_stecker()

regex = re.compile('[^a-zA-Z]')
#First parameter is the replacement, second parameter is your input string
message = list(regex.sub('', message.lower()))

rotor1 = list("ekmflgdqvzntowyhxuspaibrcj")
rotor2 = list("ajdksiruxblhwtmcqgznpyfvoe")
rotor3 = list("bdfhjlcprtxvznyeiwgakmusqo")

ukw = list("yruhqsldpxngokmiebfzcwvjat")
ukw_map = dict(zip(alphabet, ukw))





def rotate_to(rotor, letter):
    i = rotor.index(letter)
    return rotor[i:]+rotor[0:i]


def advance(rotor):
    return list(rotor[-1])+rotor[0:-1]


def enigma(rot1, rot2, rot3, positions, steckers, unsteckered, text):
    r1 = rotate_to(rot1, positions[0])
    r2 = rotate_to(rot2, positions[1])
    r3 = rotate_to(rot3, positions[2])

    map_s = dict(steckers)
    inv_map = {v: k for k, v in map_s.items()}
    map_s.update(inv_map)

    map_s.update(dict(zip(unsteckered,unsteckered)))

    output = list(text)
    for i, c in enumerate(text):

        r1 = advance(r1)
        if r1[0] == "a":
            r2 = advance(r2)
        if r2[0] == "a":
            r3 = advance(r3)
        pass

        map1f = dict(zip(alphabet, r1))
        map1b = dict(zip(r1, alphabet))

        map2f = dict(zip(alphabet, r2))
        map2b = dict(zip(r2, alphabet))

        map3f = dict(zip(alphabet, r3))
        map3b = dict(zip(r3, alphabet))

        output[i] = map_s[map1b[map2b[map3b[ukw_map[map3f[map2f[map1f[map_s[c]]]]]]]]]

    return output


coded = enigma(rotor1, rotor2, rotor3, "ttt", st, unst, message)
decode = enigma(rotor1, rotor2, rotor3, "ttt", st, unst, coded)
decode2 = enigma(rotor1, rotor2, rotor3, "ttt", st, unst, coded)
decode3 = enigma(rotor1, rotor2, rotor3, "ttt", st, unst, coded)
decode4 = enigma(rotor1, rotor2, rotor3, "ttt", st, unst, coded)




i=0
ctr=0
t = time.time()

for settings in ["ttt"]:
    # for settings in itertools.product(alphabet, repeat=3):

    i = i+1
    if i % 1000 == 0:
        print(i)
    s, u = random_stecker()

    improved = True
    best_s = s.copy()
    best_u = u.copy()
    current_s = best_s.copy()
    current_u = best_u.copy()
    decode = enigma(rotor1, rotor2, rotor3, "ttt", best_s, best_u, coded)
    best_score = same_letters(message, decode)
    while improved:
        print("looped while")
        improved = False
        for jj in range(0, 10):
            for kk in range(jj+1, 10):
                for ll in range(0, 1):
                    current_s = best_s.copy()
                    current_u = best_u.copy()
                    pair1 = current_s.pop(kk)
                    pair2 = current_s.pop(jj)
                    if ll == 0:
                        current_s.append((pair1[0], pair2[0]))
                        current_s.append((pair1[1], pair2[1]))
                    else:
                        current_s.append((pair1[0], pair2[1]))
                        current_s.append((pair1[1], pair2[0]))

                    decode = enigma(rotor1, rotor2, rotor3, settings, current_s, current_u, coded)
                    score = same_letters(decode, message)
                    if score > best_score:
                        best_score = score+0
                        print(best_score)
                        best_s = current_s.copy()
                        best_u = current_u.copy()
                        improved = True

        for jj in range(0, 10):
            for ll in range(0, 1):
                for kk in range(0, 6):
                    current_s = best_s.copy()
                    current_u = best_u.copy()
                    pair = current_s.pop(jj)
                    uns = current_u.pop(kk)
                    current_s.append((uns,pair[ll]))
                    current_u.append(pair[(ll+1) % 2])

                    decode = enigma(rotor1, rotor2, rotor3, settings, current_s, current_u, coded)
                    score = same_letters(decode, message)
                    if score > best_score:
                        best_score = score+0
                        print(best_score)
                        best_s = current_s.copy()
                        best_u = current_u.copy()
                        improved = True

    answer = ''.join(enigma(rotor1, rotor2, rotor3, settings, best_s, best_u, coded))
    print(best_s == st)
    print(best_u == unst)
    print(answer)

print(best_score)
t2 = time.time()

print(t2-t)
print(ctr)
