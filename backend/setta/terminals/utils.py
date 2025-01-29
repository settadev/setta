import re
import subprocess

import psutil


def windows_has_child_processes(input_winpid):
    if len(psutil.Process(input_winpid).children()) > 0:
        return True

    # when running in bash.exe, sometimes the bash process children
    # are not visible when querying using the windows pid
    # so this finds the corresponding bash pid for the input winpid
    # and finds its children
    output = subprocess.check_output("ps", shell=True).decode()
    processes = []
    bash_pid = None
    pid_idx, ppid_idx, winpid_idx = None, None, None
    for i, line in enumerate(output.split("\n")):  # Skip the header line
        columns = re.split(r"\s+", line)
        if i == 0:
            pid_idx = columns.index("PID")
            ppid_idx = columns.index("PPID")
            winpid_idx = columns.index("WINPID")
        elif columns != [""]:
            pid = int(columns[pid_idx])
            ppid = int(columns[ppid_idx])
            winpid = int(columns[winpid_idx])
            processes.append({"pid": pid, "ppid": ppid, "winpid": winpid})
            if winpid == input_winpid:
                bash_pid = pid

    return len([p for p in processes if p["ppid"] == bash_pid]) > 0


def linux_has_child_processes(pid):
    return len(psutil.Process(pid).children()) > 0
