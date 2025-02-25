import asyncio
import glob
import logging
import os
from typing import Dict, List, Set

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)


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
        self.file_to_patterns = {}
        self.handler = SpecificFileEventHandler(
            callback,
            asyncio.get_event_loop(),
            self.watched_files,
            self.file_to_patterns,
        )

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

    def update_watch_list(
        self, filepaths_and_glob_patterns: List[str]
    ) -> Dict[str, List[str]]:
        """
        Update the entire list of files being watched with a single function call.
        This efficiently handles adding new files and removing files that are no longer needed.

        Args:
            filepaths_and_glob_patterns: List of file paths that should be watched

        Returns:
            Dict containing 'added' and 'removed' lists of file paths
        """
        file_paths = self.get_actual_file_paths_to_watch(filepaths_and_glob_patterns)

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

    def get_actual_file_paths_to_watch(self, filepaths_and_glob_patterns):
        actual_filepaths = set()
        # Expand glob patterns and build the mapping
        for pattern in filepaths_and_glob_patterns:
            matching_files = glob.glob(pattern)
            for file_path in matching_files:
                # Only add actual files, not directories
                if os.path.isfile(file_path):
                    abs_path = os.path.abspath(file_path)
                    actual_filepaths.add(abs_path)

                    # Add to the mapping
                    if abs_path not in self.file_to_patterns:
                        self.file_to_patterns[abs_path] = set()
                    self.file_to_patterns[abs_path].add(pattern)

        return actual_filepaths

    def start(self) -> None:
        """Start the file watcher."""
        self.observer.start()
        self.started = True

    def stop(self) -> None:
        """Stop the file watcher."""
        self.observer.stop()
        self.observer.join()
        self.started = False


class SpecificFileEventHandler(FileSystemEventHandler):
    """Event handler for specific file events."""

    def __init__(self, callback, loop, watched_files_ref, file_to_patterns):
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
        self.file_to_patterns = file_to_patterns

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
        logger.debug("_send_event")
        # Get absolute path
        abs_path = os.path.abspath(event.src_path)

        # Get relative path to current working directory
        rel_path = os.path.relpath(abs_path)

        # Get file contents for created and modified events
        file_content = None
        if event_type in ("created", "modified"):
            try:
                with open(abs_path, "r", encoding="utf-8") as f:
                    file_content = f.read()
            except Exception as e:
                logger.debug(f"Error reading file {abs_path}: {e}")
                file_content = None

        # For moved events, get the content of the destination file
        dest_abs_path = None
        dest_rel_path = None
        if event_type == "moved" and hasattr(event, "dest_path"):
            dest_abs_path = os.path.abspath(event.dest_path)
            dest_rel_path = os.path.relpath(dest_abs_path)
            try:
                with open(dest_abs_path, "r", encoding="utf-8") as f:
                    file_content = f.read()
            except Exception as e:
                logger.debug(f"Error reading destination file {dest_abs_path}: {e}")
                file_content = None

        # Prepare event info object
        event_info = {
            "absPath": abs_path,
            "relPath": rel_path,
            "eventType": event_type,
            "fileContent": file_content,
            "matchingGlobPatterns": list(self.file_to_patterns[abs_path]),
        }

        # Add destination paths for moved events
        if event_type == "moved" and dest_abs_path:
            event_info["destAbsPath"] = dest_abs_path
            event_info["destRelPath"] = dest_rel_path

        logger.debug(f"will send {event_info}")
        if asyncio.iscoroutinefunction(self.callback):
            self.loop.call_soon_threadsafe(
                lambda: self.loop.create_task(self.callback(event_info))
            )
        else:
            self.callback(event_info)
