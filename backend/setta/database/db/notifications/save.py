import json


def save_notification(db, project_config_id, type, message, metadata=None):
    """
    Save a new notification to the database.

    Parameters:
    - db: The database connection/cursor object
    - project_config_id: The ID of the project associated with this notification
    - type: The notification type (e.g., 'error', 'warning', 'info', 'success')
    - message: The notification message text
    - metadata: Optional JSON-serializable dict with additional data

    Returns:
    - The ID of the newly created notification
    """
    query = """
        INSERT INTO Notifications (
            projectConfigId,
            type,
            message,
            metadata
        ) VALUES (
            :project_config_id,
            :type,
            :message,
            :metadata
        )
        RETURNING id
    """

    # Convert metadata to JSON string if provided
    metadata_json = json.dumps(metadata) if metadata is not None else None

    query_params = {
        "project_config_id": project_config_id,
        "type": type,
        "message": message,
        "metadata": metadata_json,
    }

    db.execute(query, query_params)

    # Get the ID of the inserted notification
    result = db.fetchone()
    notification_id = result["id"] if result else None

    # Commit the transaction to save changes
    # Note: If you're using a transaction manager, you might not need this
    # db.commit()

    return notification_id
