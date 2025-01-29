def position_to_line_col(text, position):
    if position < 0 or position > len(text):
        return None

    lines = text.split("\n")
    current_pos = 0

    for line_num, line in enumerate(lines):
        line_length = len(line) + 1  # +1 for the newline character
        if current_pos + line_length > position:
            col = position - current_pos
            return line_num, col
        current_pos += line_length

    # If we get here, the position is at the very end of the text
    return len(lines) - 1, len(lines[-1])


def line_col_to_position_batch(text, line_col_pairs):
    lines = text.split("\n")
    line_starts = [0]
    for line in lines[:-1]:
        line_starts.append(line_starts[-1] + len(line) + 1)

    results = []
    for line, col in line_col_pairs:
        if line < 0 or line >= len(lines) or col < 0:
            results.append(None)
        else:
            position = line_starts[line] + min(col, len(lines[line]))
            results.append(position)

    return results
