#include "Projet_Peachy.h"
#include <QtWidgets/QApplication>

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    Projet_Peachy window;
    window.show();
    return app.exec();
}
