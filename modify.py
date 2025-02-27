#!/usr/bin/env python3
import json
import sys

def transform_json(json_data):
    """
    Transform the JSON structure by replacing jsonSourceMetadata with jsonSource.
    The new jsonSource value will be set to the old jsonSourceMetadata.filenameGlob value.
    """
    if 'codeInfo' in json_data:
        for id_key, info in json_data['codeInfo'].items():
            if 'jsonSourceMetadata' in info:
                # Extract the filenameGlob value
                filename_glob = info['jsonSourceMetadata'].get('filenameGlob')
                
                # Replace jsonSourceMetadata with jsonSource
                if filename_glob is not None:
                    info['jsonSource'] = filename_glob
                    del info['jsonSourceMetadata']
    
    return json_data

def main():
    # Check if a file path was provided
    if len(sys.argv) < 2:
        print("Usage: python script.py <json_file_path>")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    
    try:
        # Read the JSON file
        with open(json_file_path, 'r') as file:
            json_data = json.load(file)
        
        # Transform the JSON
        transformed_json = transform_json(json_data)
        
        # Write the transformed JSON back to the file
        with open(json_file_path, 'w') as file:
            json.dump(transformed_json, file, indent=2)
        
        print(f"Successfully transformed {json_file_path}")
    
    except FileNotFoundError:
        print(f"Error: File '{json_file_path}' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: '{json_file_path}' is not a valid JSON file.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()