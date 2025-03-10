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
                "servers": info["servers"]
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


def get_endpoints_from_spec(openapi_obj):
    """
    Extract endpoint information from an OpenAPI object

    Args:
        openapi_obj: The OpenAPI object returned by get_openapi_spec

    Returns:
        list: List of dictionaries containing endpoint information
    """
    if not openapi_obj or not hasattr(openapi_obj, "spec"):
        return []

    # Get the raw specification dictionary
    spec_dict = openapi_obj.spec.contents()

    endpoints = []
    paths_dict = spec_dict.get("paths", {})

    for path, path_item in paths_dict.items():
        for method, operation in path_item.items():
            # Skip non-operation keys
            if method not in [
                "get",
                "post",
                "put",
                "delete",
                "patch",
                "options",
                "head",
            ]:
                continue

            endpoint_info = {
                "path": path,
                "method": method.upper(),
                "summary": operation.get("summary", ""),
                "description": operation.get("description", ""),
                "operationId": operation.get("operationId", ""),
                "tags": operation.get("tags", []),
            }

            endpoints.append(endpoint_info)

    return endpoints


def get_endpoint_parameters(openapi_obj, endpoint_path, method="get"):
    """
    Extract parameters for a specific endpoint from an OpenAPI object,
    resolving any $ref references to their actual schema definitions.

    Args:
        openapi_obj: The OpenAPI object
        endpoint_path: API endpoint path (e.g., '/completions')
        method: HTTP method (get, post, put, delete, etc.)

    Returns:
        dict: Dictionary containing parameters for the specified endpoint
    """
    if not openapi_obj or not hasattr(openapi_obj, "spec"):
        return {"error": "Invalid OpenAPI object"}

    # Get the raw specification dictionary
    spec_dict = openapi_obj.spec.contents()
    paths_dict = spec_dict.get("paths", {})

    # Check if the path exists
    if endpoint_path not in paths_dict:
        return {"error": f"Path '{endpoint_path}' not found in API specification"}

    path_item = paths_dict[endpoint_path]

    # Check if the method exists for this path
    method = method.lower()
    if method not in path_item:
        return {"error": f"Method '{method}' not supported for path '{endpoint_path}'"}

    operation = path_item[method]

    # Initialize parameters dictionary
    parameters = {}

    # Collect parameters from path level
    for param in path_item.get("parameters", []):
        # Resolve parameter reference if needed
        if "$ref" in param:
            param = resolve_reference(spec_dict, param["$ref"])

        process_parameter(param, parameters, spec_dict)

    # Collect parameters from operation level
    for param in operation.get("parameters", []):
        # Resolve parameter reference if needed
        if "$ref" in param:
            param = resolve_reference(spec_dict, param["$ref"])

        process_parameter(param, parameters, spec_dict)

    # Process security requirements (for auth headers)
    security_headers = get_security_headers(operation, spec_dict)
    if security_headers:
        if "header" not in parameters:
            parameters["header"] = []
        parameters["header"].extend(security_headers)

    # Process request body if present
    request_body = None
    if "requestBody" in operation:
        req_body_obj = operation["requestBody"]
        # Resolve reference if needed
        if "$ref" in req_body_obj:
            req_body_obj = resolve_reference(spec_dict, req_body_obj["$ref"])

        request_body = {"required": req_body_obj.get("required", False), "content": {}}

        content = req_body_obj.get("content", {})
        for content_type, media_type in content.items():
            # Resolve schema reference if present
            schema = media_type.get("schema", {})
            if schema and "$ref" in schema:
                schema = resolve_reference(spec_dict, schema["$ref"])

            request_body["content"][content_type] = {"schema": schema}

    return {
        "path": endpoint_path,
        "method": method.upper(),
        "parameters": parameters,
        "requestBody": request_body,
    }


def process_parameter(param, parameters, spec_dict):
    """Process a parameter and add it to the parameters dictionary"""
    param_location = param.get("in")

    # Skip if no location specified
    if not param_location:
        return

    # Create the location category if it doesn't exist
    if param_location not in parameters:
        parameters[param_location] = []

    # Resolve schema reference if present
    schema = param.get("schema", {})
    if schema and "$ref" in schema:
        schema = resolve_reference(spec_dict, schema["$ref"])

    param_info = {
        "name": param.get("name"),
        "required": param.get("required", False),
        "description": param.get("description", ""),
        "schema": schema,
    }

    parameters[param_location].append(param_info)


def get_security_headers(operation, spec_dict):
    """Extract security requirements as header parameters"""
    headers = []

    # Get global security requirements if no operation-specific ones
    security_reqs = operation.get("security", spec_dict.get("security", []))

    if not security_reqs:
        return headers

    # Get security schemes
    components = spec_dict.get("components", {})
    security_schemes = components.get("securitySchemes", {})

    for security_req in security_reqs:
        for scheme_name, scopes in security_req.items():
            if scheme_name in security_schemes:
                scheme = security_schemes[scheme_name]

                # Resolve reference if needed
                if "$ref" in scheme:
                    scheme = resolve_reference(spec_dict, scheme["$ref"])

                # Handle different security types
                if scheme.get("type") == "apiKey" and scheme.get("in") == "header":
                    headers.append(
                        {
                            "name": scheme.get("name"),
                            "required": True,
                            "description": scheme.get(
                                "description", f"API key for {scheme_name}"
                            ),
                            "schema": {"type": "string"},
                        }
                    )
                elif scheme.get("type") == "http" and scheme.get("scheme") == "bearer":
                    headers.append(
                        {
                            "name": "Authorization",
                            "required": True,
                            "description": scheme.get(
                                "description", "Bearer authentication token"
                            ),
                            "schema": {"type": "string", "pattern": "^Bearer .+$"},
                        }
                    )
                # You can add more security types like OAuth2, OpenID, etc.

    return headers


def resolve_reference(spec_dict, ref):
    """
    Resolve a JSON reference within the OpenAPI specification

    Args:
        spec_dict: The full OpenAPI specification dictionary
        ref: Reference string (e.g., '#/components/schemas/MySchema')

    Returns:
        dict: The resolved reference object
    """
    if not ref.startswith("#/"):
        # External references not supported in this simple implementation
        return {"error": f"External reference not supported: {ref}"}

    # Parse the reference path
    path_parts = ref[2:].split("/")  # Remove '#/' and split by '/'

    # Navigate through the spec dict
    current = spec_dict
    for part in path_parts:
        if part not in current:
            return {"error": f"Reference path not found: {ref}"}
        current = current[part]

    # If the resolved object is itself a reference, resolve it recursively
    if isinstance(current, dict) and "$ref" in current:
        return resolve_reference(spec_dict, current["$ref"])

    return current
