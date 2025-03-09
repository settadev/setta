import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests
import yaml

from setta.utils.constants import API_SPECS_FOLDER

logger = logging.getLogger(__name__)


def get_openapi_spec(api_url):
    """
    Downloads and caches OpenAPI specs locally in the setta_files folder structure.
    Handles both JSON and YAML formats.

    Args:
        api_url: URL to the OpenAPI specification

    Returns:
        dict: The parsed OpenAPI specification
    """
    # Create specs directory if it doesn't exist
    API_SPECS_FOLDER.mkdir(parents=True, exist_ok=True)

    # Create a filename based on URL hash
    url_hash = hashlib.md5(api_url.encode()).hexdigest()
    metadata_file = API_SPECS_FOLDER / f"{url_hash}.meta.json"

    # Determine file format from URL extension
    url_path = urlparse(api_url).path
    is_yaml = url_path.endswith((".yaml", ".yml"))

    # Set cache file extension based on format
    file_ext = ".yaml" if is_yaml else ".json"
    cache_file = API_SPECS_FOLDER / f"{url_hash}{file_ext}"

    # Check if we have a cached version that's less than 24 hours old
    if metadata_file.exists() and cache_file.exists():
        with metadata_file.open("r") as f:
            metadata = json.load(f)

        last_updated = datetime.fromisoformat(metadata["last_updated"])
        if datetime.now() - last_updated < timedelta(hours=24):
            # Use cached version
            return load_spec(cache_file)

    # Download fresh copy
    try:
        response = requests.get(api_url)
        response.raise_for_status()

        # Get content as text since we don't know the format yet
        content = response.text

        # Parse content based on format
        if is_yaml:
            spec = yaml.safe_load(content)
            # Save as YAML
            with cache_file.open("w") as f:
                yaml.dump(spec, f, sort_keys=False)
        else:
            # Try JSON format
            try:
                spec = json.loads(content)
                # Save as JSON
                with cache_file.open("w") as f:
                    json.dump(spec, f, indent=2)
            except json.JSONDecodeError:
                # Maybe it's YAML even though the extension doesn't indicate it
                spec = yaml.safe_load(content)
                # Change file extension
                cache_file = API_SPECS_FOLDER / f"{url_hash}.yaml"
                with cache_file.open("w") as f:
                    yaml.dump(spec, f, sort_keys=False)

        # Save metadata with human-readable name for UI display
        metadata = {
            "url": api_url,
            "last_updated": datetime.now().isoformat(),
            "api_name": extract_api_name(spec, api_url),
            "version": extract_api_version(spec),
            "format": "yaml" if is_yaml else "json",
            "cache_path": str(
                cache_file
            ),  # Convert Path to string for JSON serialization
        }
        with metadata_file.open("w") as f:
            json.dump(metadata, f, indent=2)

        return spec
    except Exception as e:
        # Return cached version if available, even if expired
        if cache_file.exists():
            return load_spec(cache_file)

        logger.debug(f"Failed to get OpenAPI spec from {api_url}: {str(e)}")
        return None


def load_spec(file_path):
    """Load a spec from file based on extension"""
    file_path = Path(file_path)  # Convert to Path object if it's a string
    ext = file_path.suffix

    with file_path.open("r") as f:
        if ext.lower() in [".yaml", ".yml"]:
            return yaml.safe_load(f)
        else:
            return json.load(f)


def extract_api_name(spec, fallback_url):
    """Extract a human-readable API name from the spec"""
    if "info" in spec and "title" in spec["info"]:
        return spec["info"]["title"]
    # Fallback to URL domain
    return urlparse(fallback_url).netloc


def extract_api_version(spec):
    """Extract API version from the spec"""
    if "info" in spec and "version" in spec["info"]:
        return spec["info"]["version"]
    return "unknown"
