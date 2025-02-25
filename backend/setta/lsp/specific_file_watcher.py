import asyncio
import os
from typing import Dict, List, Set

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer


class SpecificFileWatcher:
    """File watcher that monitors specific files and notifies via a single callback."""

    def __init__(self, callback):
        """
        Initialize the file watcher for specific files.

        Args:
            callback: Function to call when any watched file changes
                     Callback receives (file_path, event_type) where event_type is
                     one of 'created', 'modified', 'deleted', or 'moved'
        """
        self.observer = Observer()
        self.watched_files: Set[str] = set()
        self.handler = SpecificFileEventHandler(
            callback, asyncio.get_event_loop(), self.watched_files
        )
        self.started = False

    def add_file(self, file_path: str) -> bool:
        """
        Add a specific file to watch.

        Args:
            file_path: Absolute path to the file to watch

        Returns:
            bool: True if the file was added, False if it doesn't exist
        """
        if not os.path.exists(file_path):
            return False

        absolute_path = os.path.abspath(file_path)
        dir_path = os.path.dirname(absolute_path)

        # Add file to watched files if not already there
        if absolute_path not in self.watched_files:
            self.watched_files.add(absolute_path)
        else:
            # Already watching this file
            return True

        # Schedule the directory for watching if needed
        if not self.observer.emitters:
            # No directories are being watched yet
            self.observer.schedule(self.handler, dir_path, recursive=False)
        else:
            # Check if the directory is already being watched
            is_dir_watched = False
            for emitter in self.observer.emitters:
                if emitter.watch.path == dir_path:
                    is_dir_watched = True
                    break

            if not is_dir_watched:
                self.observer.schedule(self.handler, dir_path, recursive=False)

        # Start the observer if it's not already running
        if not self.started:
            self.start()

        return True

    def remove_file(self, file_path: str) -> None:
        """
        Remove a file from being watched.

        Args:
            file_path: Path to the file
        """
        absolute_path = os.path.abspath(file_path)

        if absolute_path in self.watched_files:
            self.watched_files.remove(absolute_path)

        # If no files are being watched, stop the observer
        if not self.watched_files and self.started:
            self.stop()

    def update_watch_list(self, file_paths: List[str]) -> Dict[str, List[str]]:
        """
        Update the entire list of files being watched with a single function call.
        This efficiently handles adding new files and removing files that are no longer needed.

        Args:
            file_paths: List of file paths that should be watched

        Returns:
            Dict containing 'added' and 'removed' lists of file paths
        """
        # Convert all input paths to absolute paths (only if they exist)
        absolute_paths = [
            os.path.abspath(path) for path in file_paths if os.path.exists(path)
        ]
        absolute_paths_set = set(absolute_paths)

        # Calculate differences
        files_to_add = absolute_paths_set - self.watched_files
        files_to_remove = self.watched_files - absolute_paths_set

        # Track which files were successfully added
        added_files = []

        # Add new files
        for file_path in files_to_add:
            success = self.add_file(file_path)
            if success:
                added_files.append(file_path)

        # Remove files no longer in the list
        for file_path in files_to_remove:
            self.remove_file(file_path)

        # Return information about what changed
        return {"added": added_files, "removed": list(files_to_remove)}

    def start(self) -> None:
        """Start the file watcher."""
        if not self.started:
            self.observer.start()
            self.started = True

    def stop(self) -> None:
        """Stop the file watcher."""
        if self.started:
            self.observer.stop()
            self.observer.join()
            self.started = False


class SpecificFileEventHandler(FileSystemEventHandler):
    """Event handler for specific file events."""

    def __init__(self, callback, loop, watched_files_ref):
        """
        Initialize the event handler.

        Args:
            callback: Function to call when a watched file changes
            loop: Asyncio event loop for async callbacks
            watched_files_ref: Reference to the set of files being watched
        """
        self.callback = callback
        self.loop = loop
        self.watched_files_ref = watched_files_ref

    def on_created(self, event: FileSystemEvent):
        """Handle file creation event."""
        if not event.is_directory:
            file_path = os.path.abspath(event.src_path)
            if file_path in self.watched_files_ref:
                self._send_event(event, "created")

    def on_modified(self, event: FileSystemEvent):
        """Handle file modification event."""
        if not event.is_directory:
            file_path = os.path.abspath(event.src_path)
            if file_path in self.watched_files_ref:
                self._send_event(event, "modified")

    def on_deleted(self, event: FileSystemEvent):
        """Handle file deletion event."""
        if not event.is_directory:
            file_path = os.path.abspath(event.src_path)
            if file_path in self.watched_files_ref:
                self._send_event(event, "deleted")

    def on_moved(self, event: FileSystemEvent):
        """Handle file move event."""
        if not event.is_directory:
            # For moved events, we need to check both source and destination
            src_path = os.path.abspath(event.src_path)
            dest_path = (
                os.path.abspath(event.dest_path)
                if hasattr(event, "dest_path")
                else None
            )

            # If the source was being watched, notify about the move
            if src_path in self.watched_files_ref:
                self._send_event(event, "moved")

            # If the destination is also being watched, notify about modification
            if (
                dest_path
                and dest_path in self.watched_files_ref
                and dest_path != src_path
            ):
                # Create a modified event for the destination
                self._send_event(event, "modified")

    def _send_event(self, event: FileSystemEvent, event_type: str):
        """
        Process and send the event to the callback.

        Args:
            event: The file system event
            event_type: The type of event ('created', 'modified', 'deleted', 'moved')
        """
        file_path = os.path.abspath(event.src_path)

        if asyncio.iscoroutinefunction(self.callback):
            self.loop.call_soon_threadsafe(
                lambda: self.loop.create_task(self.callback(file_path, event_type))
            )
        else:
            self.callback(file_path, event_type)
