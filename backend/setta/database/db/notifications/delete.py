def delete_notification(db, notification_id):
    """
    Delete a notification from the database by its ID.

    Parameters:
    - db: The database connection/cursor object
    - notification_id: The ID of the notification to delete

    Returns:
    - True if the notification was deleted, False if it wasn't found
    """
    query = """
        DELETE FROM Notifications
        WHERE id = :notification_id
        RETURNING id
    """

    db.execute(query, {"notification_id": notification_id})
    result = db.fetchone()

    return result is not None
