import asyncio
import os
import site
from pathlib import Path
from typing import Set

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer


class LSPFileWatcher:
    def __init__(self, notify_callback):
        """
        Initialize the file watcher.

        Args:
            notify_callback: Callback function that sends notifications to the LSP server.
                           Should accept FileSystemEvent as parameter.
        """
        self.observer = Observer()
        self.watched_paths: Set[str] = set()
        self.handler = LSPEventHandler(notify_callback, asyncio.get_event_loop())

    def add_workspace_folder(self, path: str) -> None:
        """
        Add a workspace folder to watch.

        Args:
            path: Path to the workspace folder
        """
        if not os.path.exists(path):
            raise ValueError(f"Path does not exist: {path}")

        absolute_path = os.path.abspath(path)
        if absolute_path not in self.watched_paths:
            self.watched_paths.add(absolute_path)
            self.observer.schedule(self.handler, absolute_path, recursive=True)

    def add_python_site_packages(self) -> None:
        """Add Python site-packages directories to watched paths."""
        for path in site.getsitepackages():
            try:
                self.add_workspace_folder(path)
            except ValueError:
                continue  # Skip if path doesn't exist

    def start(self) -> None:
        """Start the file watcher."""
        self.observer.start()

    def stop(self) -> None:
        """Stop the file watcher."""
        self.observer.stop()
        self.observer.join()

    def is_watching(self, path: str) -> bool:
        """
        Check if a path is being watched.

        Args:
            path: Path to check

        Returns:
            bool: True if the path is being watched
        """
        absolute_path = os.path.abspath(path)
        return any(
            absolute_path.startswith(watched_path)
            for watched_path in self.watched_paths
        )


class LSPEventHandler(FileSystemEventHandler):
    def __init__(self, callback, loop):
        self.callback = callback
        self.loop = loop

    def on_any_event(self, event: FileSystemEvent):
        if event.is_directory:
            return

        changes = [
            {
                "uri": self._path_to_uri(event.src_path),
                "type": self._get_change_type(event),
            }
        ]

        if asyncio.iscoroutinefunction(self.callback):
            self.loop.call_soon_threadsafe(
                lambda: self.loop.create_task(self.callback(changes))
            )
        else:
            self.callback(changes)

    def _path_to_uri(self, path: str) -> str:
        """Convert file path to URI format."""
        return Path(path).as_uri()

    def _get_change_type(self, event: FileSystemEvent) -> int:
        """
        Convert watchdog event type to LSP change type.
        1: Created
        2: Changed
        3: Deleted
        """
        if event.event_type == "created":
            return 1
        elif event.event_type == "modified":
            return 2
        elif event.event_type == "deleted":
            return 3
        return 2  # Default to changed
