from setta.utils.utils import try_json


def load_project_notifications(db, project_config_id, limit=20):
    """
    Load the latest notifications for a specific project.

    Parameters:
    - db: The database connection/cursor object
    - project_config_id: The ID of the project to get notifications for
    - limit: Maximum number of notifications to return (default: 20)

    Returns:
    - A list of notification objects
    """
    query = """
        SELECT
            id,
            timestamp,
            type,
            message,
            metadata,
            read_status
        FROM
            Notifications
        WHERE
            projectConfigId = :project_config_id
        ORDER BY
            id DESC
        LIMIT :limit
    """

    query_params = {"project_config_id": project_config_id, "limit": limit}

    db.execute(query, query_params)

    notifications = []
    for row in db.fetchall():
        notification = create_notification_dict(**row)
        notifications.append(notification)

    return notifications


def load_notification(db, notification_id):
    """
    Load a single notification by its ID.

    Parameters:
    - db: The database connection/cursor object
    - notification_id: The ID of the notification to retrieve

    Returns:
    - A notification object if found, None otherwise
    """
    query = """
        SELECT
            id,
            timestamp,
            type,
            message,
            metadata,
            read_status
        FROM
            Notifications
        WHERE
            id = :notification_id
    """

    query_params = {"notification_id": notification_id}

    db.execute(query, query_params)
    row = db.fetchone()

    if not row:
        return None

    return create_notification_dict(**row)


def create_notification_dict(
    id, type, message, timestamp=None, metadata=None, read_status=False
):
    read_status = bool(read_status)
    if not isinstance(metadata, dict):
        metadata = try_json(metadata)
    if metadata is None:
        metadata = {}

    return {
        "id": id,
        "type": type,
        "message": message,
        "timestamp": timestamp,
        "metadata": metadata,
        "read_status": read_status,
    }
