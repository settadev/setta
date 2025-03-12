import json


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
            timestamp DESC
        LIMIT :limit
    """

    query_params = {"project_config_id": project_config_id, "limit": limit}

    db.execute(query, query_params)

    notifications = []
    for row in db.fetchall():
        notification = {
            "id": row["id"],
            "timestamp": row["timestamp"],
            "type": row["type"],
            "message": row["message"],
            "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
            "read_status": bool(row["read_status"]),
        }
        notifications.append(notification)

    return notifications
