import random
import itertools
import operator
import json


class UnableToComputeError(Exception):
    pass


VERBOSE_MODE = False


def log(str):
    if VERBOSE_MODE:
        print(str)


def custom_division_func(a, b):
    a, b = int(a), int(b)
    log("func_div {}, {}".format(a, b))
    if b == 0 or a < b or a % b != 0:
        raise UnableToComputeError()
    else:
        result = a // b  # Integer division
        return str(result)


def custom_addition_func(a, b):
    log("func_add {}, {}".format(a, b))
    return int(a) + int(b)


def custom_subtraction_func(a, b):
    log("func_sub {}, {}".format(a, b))
    return int(a) - int(b)


def custom_multiplu_func(a, b):
    log("func_mul {}, {}".format(a, b))
    return int(a) * int(b)


def eval_expr(a_val, b_op, b_val, c_op, c_val):
    # Construct the expression: a b c, where b and c are operators
    # Apply BODMAS using integer division
    ops = {
        "+": custom_addition_func,
        "-": custom_subtraction_func,
        "*": custom_multiplu_func,
        "/": custom_division_func,
    }

    try:
        # First compute B op C
        if b_op in "*/" or c_op in "+-":
            log("Processing A and B first")
            ab = ops[b_op](a_val, b_val)
            log("Result of A and B {}".format(ab))
            if ab is None:
                return None
            result = ops[c_op](ab, c_val)
            log("Result of AB and C: {}".format(result))
        else:
            log("Processing B and C first")
            bc = ops[c_op](b_val, c_val)
            log("Result of B and C: {}".format(bc))
            if bc is None:
                return None
            result = ops[b_op](a_val, bc)
            log("Result of A and BC: {}".format(result))
        return result
    except Exception as e:
        log("Exception raised")
        return None


def generate_option():
    op = random.choice(["+", "-", "*", "/"])
    val = random.randint(1, 20)
    return op + str(val)


def parse_option(opt):
    return opt[0], int(opt[1:])


def generate_single_puzzle():
    max_attempts = 1000
    for _ in range(max_attempts):
        target = random.randint(10, 99)
        options = [generate_option() for _ in range(10)]
        count = 0
        valid_triples = []

        for combo in itertools.combinations(options, 3):
            a_op, a_val = parse_option(combo[0])
            b_op, b_val = parse_option(combo[1])
            c_op, c_val = parse_option(combo[2])

            try:
                result = eval_expr(a_val, b_op, b_val, c_op, c_val)
            except:
                continue
            if result == target and combo not in valid_triples:
                valid_triples.append(combo)
                count += 1
            if count >= 5:
                return {
                    "target": target,
                    "options": options,
                    "valid_equations": valid_triples[:5],
                }

    return None  # Failed to generate


def generate_puzzles(n=2):
    puzzles = []
    while len(puzzles) < n:
        puzzle = generate_single_puzzle()
        if puzzle:
            puzzles.append(puzzle)
    return puzzles


# VERBOSE_MODE = True


puzzles = generate_puzzles(n=30)
for i, p in enumerate(puzzles):
    print(f"Puzzle {i+1}")
    print("Target:", p["target"])
    print("Options:", p["options"])
    print("Valid Equations:", p["valid_equations"])
    print()

with open("/Users/zeko/dev/arithmatricks/src/puzzles_v1.json", "w") as f:
    json.dump({"puzzles": puzzles}, f)

# res = eval_expr("6", "-", "2", "-", "16")
# print(res)
