import hashlib
import json
import logging
from datetime import datetime, timedelta

import requests
from openapi_core import OpenAPI

from setta.utils.constants import API_SPECS_FOLDER

logger = logging.getLogger(__name__)


def get_openapi_spec(api_url):
    """
    Downloads and caches OpenAPI specs locally in the setta_files folder structure.
    Uses openapi_core to parse the specification.

    Args:
        api_url: URL to the OpenAPI specification

    Returns:
        OpenAPI: The parsed OpenAPI specification object or None if parsing fails
    """
    # Create specs directory if it doesn't exist
    API_SPECS_FOLDER.mkdir(parents=True, exist_ok=True)

    # Create a filename based on URL hash
    url_hash = hashlib.md5(api_url.encode()).hexdigest()
    metadata_file = API_SPECS_FOLDER / f"{url_hash}.meta.json"
    cache_file = API_SPECS_FOLDER / f"{url_hash}.spec"

    # Check if we have a cached version that's less than 24 hours old
    if metadata_file.exists() and cache_file.exists():
        with metadata_file.open("r") as f:
            metadata = json.load(f)

        last_updated = datetime.fromisoformat(metadata["last_updated"])
        if datetime.now() - last_updated < timedelta(hours=24):
            # Use cached version
            try:
                # Use openapi_core to load and validate the spec
                return OpenAPI.from_file_path(cache_file)
            except Exception as e:
                logger.error(f"Error loading cached spec: {str(e)}")

    # Download fresh copy
    try:
        response = requests.get(api_url)
        response.raise_for_status()

        # Save raw content directly to file
        with cache_file.open("wb") as f:
            f.write(response.content)

        # Use openapi_core to load and validate the spec
        try:
            spec = OpenAPI.from_file_path(cache_file)
            info = get_api_info(spec)

            # Save metadata
            metadata = {
                "url": api_url,
                "last_updated": datetime.now().isoformat(),
                "api_name": info["title"],
                "version": info["version"],
            }
            with metadata_file.open("w") as f:
                json.dump(metadata, f, indent=2)

            return spec

        except Exception as e:
            logger.error(f"Error validating spec with openapi_core: {str(e)}")
            return None

    except Exception as e:
        logger.error(f"Error downloading or parsing spec: {str(e)}")

        # Return cached version if available, even if expired
        if cache_file.exists():
            try:
                return OpenAPI.from_file_path(cache_file)
            except Exception as inner_e:
                logger.error(f"Error loading cached spec file: {str(inner_e)}")

        # Return None if all attempts fail
        return None


def get_api_info(openapi_obj):
    """
    Extract API name, version, and other metadata from an OpenAPI object

    Args:
        openapi_obj: The OpenAPI object returned by get_openapi_spec

    Returns:
        dict: Dictionary containing API metadata
    """
    if not openapi_obj or not hasattr(openapi_obj, "spec"):
        return {"error": "Invalid OpenAPI object"}

    # Get the raw specification dictionary
    spec_dict = openapi_obj.spec.contents()

    # Extract API information from the 'info' section
    info = spec_dict.get("info", {})

    result = {
        "title": info.get("title", "Unknown API"),
        "version": info.get("version", "Unknown"),
        "description": info.get("description", ""),
    }

    # Additional metadata if available
    if "contact" in info:
        result["contact"] = info["contact"]

    if "license" in info:
        result["license"] = info["license"]

    if "termsOfService" in info:
        result["termsOfService"] = info["termsOfService"]

    # Server information if available
    if "servers" in spec_dict and spec_dict["servers"]:
        result["servers"] = spec_dict["servers"]

    return result
