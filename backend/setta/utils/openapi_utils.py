import os
import json
import yaml
import requests
import hashlib
from datetime import datetime, timedelta
from urllib.parse import urlparse

def get_openapi_spec(api_url, base_dir="./setta_files"):
    """
    Downloads and caches OpenAPI specs locally in the setta_files folder structure.
    Handles both JSON and YAML formats.
    
    Args:
        api_url: URL to the OpenAPI specification
        base_dir: Base directory for your application files
    
    Returns:
        dict: The parsed OpenAPI specification
    """
    # Create specs directory if it doesn't exist
    specs_dir = os.path.join(base_dir, "api_specs")
    os.makedirs(specs_dir, exist_ok=True)
    
    # Create a filename based on URL hash
    url_hash = hashlib.md5(api_url.encode()).hexdigest()
    metadata_file = os.path.join(specs_dir, f"{url_hash}.meta.json")
    
    # Determine file format from URL extension
    url_path = urlparse(api_url).path
    is_yaml = url_path.endswith(('.yaml', '.yml'))
    
    # Set cache file extension based on format
    file_ext = '.yaml' if is_yaml else '.json'
    cache_file = os.path.join(specs_dir, f"{url_hash}{file_ext}")
    
    # Check if we have a cached version that's less than 24 hours old
    if os.path.exists(metadata_file) and os.path.exists(cache_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        last_updated = datetime.fromisoformat(metadata['last_updated'])
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
            with open(cache_file, 'w') as f:
                yaml.dump(spec, f, sort_keys=False)
        else:
            # Try JSON format
            try:
                spec = json.loads(content)
                # Save as JSON
                with open(cache_file, 'w') as f:
                    json.dump(spec, f, indent=2)
            except json.JSONDecodeError:
                # Maybe it's YAML even though the extension doesn't indicate it
                spec = yaml.safe_load(content)
                # Change file extension
                cache_file = os.path.join(specs_dir, f"{url_hash}.yaml")
                with open(cache_file, 'w') as f:
                    yaml.dump(spec, f, sort_keys=False)
        
        # Save metadata with human-readable name for UI display
        metadata = {
            'url': api_url,
            'last_updated': datetime.now().isoformat(),
            'api_name': extract_api_name(spec, api_url),
            'version': extract_api_version(spec),
            'format': 'yaml' if is_yaml else 'json',
            'cache_path': cache_file
        }
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return spec
    except Exception as e:
        # Return cached version if available, even if expired
        if os.path.exists(cache_file):
            return load_spec(cache_file)
        raise e

def load_spec(file_path):
    """Load a spec from file based on extension"""
    _, ext = os.path.splitext(file_path)
    with open(file_path, 'r') as f:
        if ext.lower() in ['.yaml', '.yml']:
            return yaml.safe_load(f)
        else:
            return json.load(f)

def extract_api_name(spec, fallback_url):
    """Extract a human-readable API name from the spec"""
    if 'info' in spec and 'title' in spec['info']:
        return spec['info']['title']
    # Fallback to URL domain
    return urlparse(fallback_url).netloc

def extract_api_version(spec):
    """Extract API version from the spec"""
    if 'info' in spec and 'version' in spec['info']:
        return spec['info']['version']
    return "unknown"