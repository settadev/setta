import copy

from .copy import copy_project_config, copy_project_details
from .save import save_project_details


def save_as_new_project_config(db, project, new_config_name, with_refs):
    if not with_refs:
        project_to_save = copy_project_details(
            project, new_config_name, do_create_new_id=True
        )
    else:
        project_to_save = copy.deepcopy(project)
        project_to_save["projectConfig"] = copy_project_config(
            project_to_save["projectConfig"], new_config_name, do_create_new_id=True
        )
    save_project_details(db, project_to_save)
    return project_to_save


def save_as_existing_project_config(db, project, config_name):
    query = """
        SELECT *
        FROM ProjectConfig
        WHERE name = :config_name
    """

    db.execute(query, {"config_name": config_name})
    x = db.fetchone()
    project["projectConfig"] = {
        **project["projectConfig"],
        "id": x["id"],
        "name": x["name"],
    }
    project_to_save = copy_project_details(project)
    save_project_details(db, project_to_save)
    return project_to_save
