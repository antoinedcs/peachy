#pragma once

#include <QtWidgets/QMainWindow>
#include "ui_Projet_Peachy.h"

class Projet_Peachy : public QMainWindow
{
    Q_OBJECT

public:
    Projet_Peachy(QWidget *parent = nullptr);
    ~Projet_Peachy();

private:
    Ui::Projet_PeachyClass ui;
};

